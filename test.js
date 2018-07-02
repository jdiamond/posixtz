const { formatPosixTZ, parsePosixTZ, getOffsetForLocalDateWithPosixTZ, formatLocalDateWithOffset } = require('.');

describe('formatPosixTZ', () => {
  test('it formats correctly before and after the 2007 DST extension', () => {
    // The US extended when DST starts and ends in 2007.
    // Source: https://en.wikipedia.org/wiki/Daylight_saving_time_in_the_United_States#2005%E2%80%932009:_Second_extension
    expect(formatPosixTZ('America/Los_Angeles', 2006)).toBe('PST8PDT,M4.1.0,M10.5.0');
    expect(formatPosixTZ('America/Los_Angeles', 2007)).toBe('PST8PDT,M3.2.0,M11.1.0');
  });

  test('it formats last sunday as 5 even in years when the last sunday was in the 4th week', () => {
    // Germany starts DST on the last Sunday of March and ends on the last Sunday of October.
    // Source: https://en.wikipedia.org/wiki/Time_in_Germany

    // In 2017, there were 4 Sundays in March and 5 Sundays in October:
    expect(formatPosixTZ('Europe/Berlin', 2017)).toBe('CET-1CEST,M3.5.0,M10.5.0/3');

    // In 2018, there were 4 Sundays in March and 4 Sundays in October:
    expect(formatPosixTZ('Europe/Berlin', 2018)).toBe('CET-1CEST,M3.5.0,M10.5.0/3');

    // In 2019, there were 5 Sundays in March and 4 Sundays in October:
    expect(formatPosixTZ('Europe/Berlin', 2019)).toBe('CET-1CEST,M3.5.0,M10.5.0/3');
  });
});

describe('parsePosixTZ', () => {
  test('it parses transitions correctly', () => {
    expect(parsePosixTZ('PST8PDT,M4.1.0,M10.5.0', 2006)).toEqual({
      stdAbbr: 'PST',
      stdOffset: -480,
      dst: true,
      dstAbbr: 'PDT',
      dstOffset: -420,
      dstStart: { month: 4, week: 1, day: 0, hour: 2, minute: 0, second: 0 },
      dstEnd: { month: 10, week: 5, day: 0, hour: 2, minute: 0, second: 0 }
    });

    expect(parsePosixTZ('PST8PDT,M3.2.0,M11.1.0', 2007)).toEqual({
      stdAbbr: 'PST',
      stdOffset: -480,
      dst: true,
      dstAbbr: 'PDT',
      dstOffset: -420,
      dstStart: { month: 3, week: 2, day: 0, hour: 2, minute: 0, second: 0 },
      dstEnd: { month: 11, week: 1, day: 0, hour: 2, minute: 0, second: 0 }
    });

    expect(parsePosixTZ('GMT0BST,M3.5.0/1,M10.5.0', 2018)).toEqual({
      stdAbbr: 'GMT',
      stdOffset: 0,
      dst: true,
      dstAbbr: 'BST',
      dstOffset: 60,
      dstStart: { month: 3, week: 5, day: 0, hour: 1, minute: 0, second: 0 },
      dstEnd: { month: 10, week: 5, day: 0, hour: 2, minute: 0, second: 0 }
    });
  });
});

describe('getOffsetForLocalDateWithPosixTZ', () => {
  test('it returns the correct offset before and after DST starts and ends', () => {
    // In 2018, March 11 was the 2nd Sunday in March.
    expect(getOffsetForLocalDateWithPosixTZ('2018-03-11T01:59:59', 'PST8PDT,M3.2.0,M11.1.0')).toBe(-480);
    expect(getOffsetForLocalDateWithPosixTZ('2018-03-11T02:00:00', 'PST8PDT,M3.2.0,M11.1.0')).toBe(-420);

    // In 2018, November 4 was the 1st Sunday in November.
    expect(getOffsetForLocalDateWithPosixTZ('2018-11-04T01:59:59', 'PST8PDT,M3.2.0,M11.1.0')).toBe(-420);
    expect(getOffsetForLocalDateWithPosixTZ('2018-11-04T02:00:00', 'PST8PDT,M3.2.0,M11.1.0')).toBe(-480);
  });
});

describe('formatLocalDateWithOffset', () => {
  test('it formats the correct offset before and after DST starts and ends', () => {
    // In 2018, March 11 was the 2nd Sunday in March.
    expect(formatLocalDateWithOffset('2018-03-11T01:59:59', 'PST8PDT,M3.2.0,M11.1.0')).toBe(
      '2018-03-11T01:59:59-08:00'
    );
    expect(formatLocalDateWithOffset('2018-03-11T02:00:00', 'PST8PDT,M3.2.0,M11.1.0')).toBe(
      '2018-03-11T02:00:00-07:00'
    );

    // In 2018, November 4 was the 1st Sunday in November.
    expect(formatLocalDateWithOffset('2018-11-04T01:59:59', 'PST8PDT,M3.2.0,M11.1.0')).toBe(
      '2018-11-04T01:59:59-07:00'
    );
    expect(formatLocalDateWithOffset('2018-11-04T02:00:00', 'PST8PDT,M3.2.0,M11.1.0')).toBe(
      '2018-11-04T02:00:00-08:00'
    );
  });
});
