# posixtz

This package contains functions for working with POSIX time zones.

## Install

posixtz depends on moment and moment-timezone as peer dependencies. You must
install them yourself:

```
npm install posixtz moment moment-timezone
```

## API

posixtz exports these functions:

- `formatPosixTZ`
- `parsePosixTZ`
- `getOffsetForLocalDateWithPosixTZ`
- `formatLocalDateWithOffset`

Import them like this:

```
const {
  formatPosixTZ,
  parsePosixTZ,
  getOffsetForLocalDateWithPosixTZ,
  formatLocalDateWithOffset
} = require('posixtz');
```

Or like this:

```
import {
  formatPosixTZ,
  parsePosixTZ,
  getOffsetForLocalDateWithPosixTZ,
  formatLocalDateWithOffset
} from 'posixtz';
```

### formatPosixTZ

`formatPosixTZ` accepts an IANA time zone string and an optional year (defaults
to current year) and returns a POSIX time zone string for that year.

```
> formatPosixTZ('America/Los_Angeles', 2018)
'PST8PDT,M3.2.0,M11.1.0'
```

### parsePosixTZ

`parsePosixTZ` accepts a POSIX time zone string and returns an object like this:

```
> parsePosixTZ('PST8PDT,M3.2.0,M11.1.0')
{ stdAbbr: 'PST',
  stdOffset: 480,
  dst: true,
  dstAbbr: 'PDT',
  dstOffset: 420,
  dstStart: { month: 3, week: 2, day: 0, hour: 2, minute: 0, second: 0 },
  dstEnd: { month: 11, week: 1, day: 0, hour: 2, minute: 0, second: 0 } }
```

### getOffsetForLocalDateWithPosixTZ

`getOffsetForLocalDateWithPosixTZ` accepts a date/time string and a POSIX time
zone string and returns a the offset from UTC (in minutes) on that date and at
that time based on whether daylight savings time was in effect or not.

```
> getOffsetForLocalDateWithPosixTZ('2018-03-11T02:00:00', 'PST8PDT,M3.2.0,M11.1.0')
-420
```

### formatLocalDateWithOffset

`formatLocalDateWithOffset` accepts a date/time string and a POSIX time zone
string and formats it as ISO 8601 plus the offset computed from the POSIX time
zone string.

```
> formatLocalDateWithOffset('2018-03-11T02:00:00', 'PST8PDT,M3.2.0,M11.1.0')
'2018-03-11T02:00:00-07:00'
```

## Dependencies

moment and moment-timezone are currently required, but I would like it to use
luxon or Intl, if possible.

## Acknowledgements

The code for the format function originally came from this Moment.js GitHub
issue:

- https://github.com/moment/moment-timezone/issues/314

## Resources

More information on POSIX time zones here:

- https://www.ibm.com/developerworks/aix/library/au-aix-posix/index.html
- http://www.gnu.org/software/libc/manual/html_node/TZ-Variable.html
