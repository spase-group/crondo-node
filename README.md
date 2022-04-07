# cronrun

[![Version](https://badgen.net/npm/v/cronrun?icon=npm)](https://badgen.net/npm/v/cronrun)
[![Build Status](https://badgen.net/github/status/spase-group/cronrun-node?icon=github)](https://badgen.net/github/status/spase-group/cronrun-node)
[![Build Checks](https://badgen.net/github/checks/spase-group/cronrun-node?icon=github)](https://badgen.net/github/checks/spase-group/cronrun-node)
[![Dependency Status](https://badgen.net/david/dep/spase-group/cronrun-node)](https://badgen.net/david/dev/kelektiv/node-cron)
[![Code Coverage](https://badgen.net/codecov/c/github/spase-group/cronrun-node?icon=codecov)](https://badgen.net/codecov/c/github/spase-group/cronrun-node)
[![Known Vulnerabilities](https://snyk.io/test/github/spase-group/cronrun-node/badge.svg)](https://snyk.io/test/github/spase-group/cronrun-node)
[![Minified size](https://badgen.net/bundlephobia/min/cronrun)](https://badgen.net/bundlephobia/min/cronrun)
[![Minzipped size](https://badgen.net/bundlephobia/minzip/cronrun)](https://badgen.net/bundlephobia/minzip/cronrun)
[![monthly downloads](https://badgen.net/npm/dm/cronrun?icon=npm)](https://badgen.net/npm/dm/cron)

Cronrun is a command line tool to schedule and run tasks with the output written to the console, 
a log file or emailed. The tool runs in the user space and executes tasks in the same space.

# Installation

    npm install cronrun

# If You Are Submitting Bugs/Issues

Because we can't magically know what you are doing to expose an issue, it is
best if you provide a snippet of code. This snippet need not include any
private (secret) information, but it must replicate the issue you are describing. 

# Usage (basic cron usage):

## Say "Hello world!" every minute

**config file: hello.json**

```javascript
{
   "description" : "Sample config",
   "jobs" : [
      {
         "subject" : "Echo \"Hello world!\" to console",
         "description" : "Sample to echo to console the phrase \"Hello world!\"",
         "mailto" : false,
         "every" : {
                        "seconds": "0"
                    },
         "task" : "echo \"Hello World!\""
      }
   ]
}
```

**Command**
```
cronrun hello.json
```

There are more examples available in this repository at:
[/examples](https://github.com/spase-group/cronrun-node/tree/master/examples)

# Cron patterns:
The value of time segemnt is specified using cron patterns. 

    Every. E.g. *
    Ranges. E.g. 1-3,5
    Steps. E.g. */2

[More details on cron patterns here](http://crontab.org). 

# Cron Ranges

When specifying your cron values you'll need to make sure that your values fall
within the ranges. For instance, some cron's use a 0-7 range for the day of
week where both 0 and 7 represent Sunday. We do not. And that is an optimisation.

- Seconds: 0-59
- Minutes: 0-59
- Hours: 0-23
- Day of Month: 1-31
- Months: 0-11 (Jan-Dec)
- Day of Week: 0-6 (Sun-Sat)

# Contributions

This is a community effort project. To all that have contributed, Thank You!

# License

Apache 2.0