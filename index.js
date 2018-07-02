const moment = require('moment-timezone');

exports.formatPosixTZ = formatPosixTZ;
exports.parsePosixTZ = parsePosixTZ;
exports.getOffsetForLocalDateWithPosixTZ = getOffsetForLocalDateWithPosixTZ;
exports.formatLocalDateWithOffset = formatLocalDateWithOffset;

function formatPosixTZ(tz, year) {
  // This code originally came from here:
  // https://github.com/moment/moment-timezone/issues/314
  // Slightly modified to be more correct.

  var jan = moment.tz({ year, month: 0, day: 1 }, tz);
  var jun = moment.tz({ year, month: 5, day: 1 }, tz);
  var janOffset = jan.utcOffset();
  var junOffset = jun.utcOffset();
  var stdOffset = Math.min(janOffset, junOffset);
  var dltOffset = Math.max(janOffset, junOffset);
  var std = stdOffset === janOffset ? jan : jun;
  var dlt = dltOffset === janOffset ? jan : jun;

  var s = formatAbbreviationForPosix(std).concat(formatOffsetForPosix(stdOffset));

  if (stdOffset !== dltOffset) {
    s = s.concat(formatAbbreviationForPosix(dlt));

    if (dltOffset !== stdOffset + 60) {
      s = s.concat(formatOffsetForPosix(dltOffset));
    }

    s = s.concat(',').concat(formatTransitionForPosix(tz, std));
    s = s.concat(',').concat(formatTransitionForPosix(tz, dlt));
  }

  return s;

  function formatAbbreviationForPosix(m) {
    var a = m.format('z');
    return /^[\+\-\d]+$/.test(a) ? '<'.concat(a).concat('>') : a;
  }

  function formatOffsetForPosix(offset) {
    var h = (-offset / 60) | 0;
    var m = Math.abs(offset % 60);
    return h + (m === 0 ? '' : ':'.concat(m < 10 ? '0' : '').concat(m));
  }

  function formatTransitionForPosix(tz, m) {
    var transition = getTransition(tz, m);

    if (!transition) {
      return 'J365/25';
    }

    var n = getWeekNumber(transition);

    if (n === 4) {
      // Some time zones transition on the _last_ Sunday of a month. That could
      // be the 4th or 5th Sunday depending on the year. The POSIX TZ format
      // uses "5" to represent "last" even on years when there are only 4
      // occurrences of that day in a given month. This loop looks forward 6
      // more years to try to catch that. I don't think this is foolproof, but I
      // haven't seen it be wrong for the current year yet.
      for (var i = 1; i <= 6; i++) {
        var nextTransition = getTransition(tz, m.clone().add(i, 'years'));

        if (!nextTransition) {
          continue;
        }

        n = Math.max(n, getWeekNumber(nextTransition));
      }
    }

    var s = transition.format('[M]M.[n].d').replace('n', n);
    var time = transition
      .format('[/]H:mm:ss')
      .replace(/\:00$/, '')
      .replace(/\:00$/, '');

    if (time !== '/2') {
      s = s.concat(time);
    }

    return s;
  }

  function getTransition(tz, m) {
    var zone = moment.tz.zone(tz);
    var ts = zone.untils[zone._index(m)];

    if (!isFinite(ts)) {
      return null;
    }

    return moment(ts).utcOffset(-zone.utcOffset(ts - 1));
  }

  function getWeekNumber(m) {
    return Math.ceil(m.date() / 7);
  }
}

function parsePosixTZ(tz) {
  const result = {
    stdAbbr: null,
    stdOffset: 0,
    dst: false,
    dstAbbr: null,
    dstOffset: null,
    dstStart: null,
    dstEnd: null
  };

  const parts = tz.split(',');

  const localTZ = parts[0];

  const LOCAL_TZ_RE = /(\w+)([+-]?\d+)(\w+([+-]?\d+)?)?/;
  // Groups:           1    2         3   4
  // 1: stdAbbr
  // 2: stdOffset
  // 3: dstAbbr
  // 4: dstOffset

  const match = LOCAL_TZ_RE.exec(localTZ);

  if (!match) {
    return null;
  }

  result.stdAbbr = match[1];
  result.stdOffset = match[2] ? parseOffset(match[2]) : 0;

  if (match[3]) {
    result.dst = true;
    result.dstAbbr = match[3];
    result.dstOffset = match[4] ? parseOffset(match[4]) : result.stdOffset + 60;
    result.dstStart = parseTransition(parts[1]);
    result.dstEnd = parseTransition(parts[2]);
  }

  return result;

  function parseOffset(offset) {
    // TODO: support hh:mm:ss
    let hours = Number(offset);

    if (hours) {
      hours *= -1;
    }

    return hours * 60;
  }

  function parseTransition(transition) {
    if (transition[0] === 'M') {
      const parts = transition.slice(1).split('/');

      const [month, week, day] = parts[0].split('.');

      const time = {
        hour: 2,
        minute: 0,
        second: 0
      };

      if (parts[1]) {
        const timeParts = parts[1].split(':');

        time.hour = Number(timeParts[0]);
        time.minute = timeParts[1] ? Number(timeParts[1]) : 0;
        time.second = timeParts[2] ? Number(timeParts[2]) : 0;
      }

      return Object.assign(
        {
          month: Number(month),
          week: Number(week),
          day: Number(day)
        },
        time
      );
    }

    // TODO: support J

    return null;
  }
}

function getOffsetForLocalDateWithPosixTZ(localDate, posixTZ) {
  const dt = moment.utc(localDate);

  const parsedTZ = parsePosixTZ(posixTZ);

  if (parsedTZ.dst) {
    const year = dt.year();
    const dstStart = transitionToDate(year, parsedTZ.dstStart);
    const dstEnd = transitionToDate(year, parsedTZ.dstEnd);

    if (dt >= dstStart && dt < dstEnd) {
      return parsedTZ.dstOffset;
    }
  }

  return parsedTZ.stdOffset;

  function transitionToDate(year, { month, week, day, hour, minute, second }) {
    const jsMonth = month - 1;

    const dt = moment.utc({ year, month: jsMonth });

    dt.weekday(day);

    if (dt.month() !== jsMonth) {
      dt.add(1, 'week');
    }

    if (week > 1) {
      dt.add(week - 1, 'weeks');

      if (dt.month() !== jsMonth) {
        dt.subtract(1, 'week');
      }
    }

    dt.set({ hour, minute, second });

    return dt.toDate();
  }
}

function formatLocalDateWithOffset(localDate, posixTZ) {
  const dt = moment.utc(localDate);
  const offset = getOffsetForLocalDateWithPosixTZ(dt, posixTZ);
  const dtWithOffset = dt.clone().utcOffset(offset);

  return dt.format('YYYY-MM-DDTHH:mm:ss') + dtWithOffset.format('Z');
}
