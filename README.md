# crondo

[![Version](https://badgen.net/npm/v/crondo?icon=npm)](https://badgen.net/npm/v/crondo)
[![Build Status](https://badgen.net/github/status/spase-group/crondo-node?icon=github)](https://badgen.net/github/status/spase-group/crondo-node)
[![Build Checks](https://badgen.net/github/checks/spase-group/crondo-node?icon=github)](https://badgen.net/github/checks/spase-group/crondo-node)
[![Dependency Status](https://badgen.net/david/dep/spase-group/crondo-node)](https://badgen.net/david/dev/kelektiv/node-cron)
[![Code Coverage](https://badgen.net/codecov/c/github/spase-group/crondo-node?icon=codecov)](https://badgen.net/codecov/c/github/spase-group/crondo-node)
[![Known Vulnerabilities](https://snyk.io/test/github/spase-group/crondo-node/badge.svg)](https://snyk.io/test/github/spase-group/crondo-node)
[![Minified size](https://badgen.net/bundlephobia/min/crondo)](https://badgen.net/bundlephobia/min/crondo)
[![Minzipped size](https://badgen.net/bundlephobia/minzip/crondo)](https://badgen.net/bundlephobia/minzip/crondo)
[![monthly downloads](https://badgen.net/npm/dm/crondo?icon=npm)](https://badgen.net/npm/dm/crondo)

Crondo (/krɒn:du:/) is a command line tool to schedule and run tasks with the output written to the console, 
a log file or emailed. The tool runs in the user space and executes tasks in the same space. The tasks to perform, 
the schedule to perform those tasks, the timzone to use and the mail transport to use is defined in a configuration file.

# Installation

    npm install crondo

# If You Are Submitting Bugs/Issues

Because we can't magically know what you are doing to expose an issue, it is
best if you provide a snippet of code. This snippet need not include any
private (secret) information, but it must replicate the issue you are describing. 

# Configuration 

The tasks to perform, the schedule to perform those tasks, the timzone to use and the mail transport to use 
is defined in a configuration file that is in JSON format. The structure of the Javascript object is:
```json
{
   "description" : [string],
   "mailer": {
      "active" : [boolean],
      "service": ["gmail"],
      "auth" : {
            "user": [string],
            "pass": [string]
         }
   },
   "timezone" : [string],
   "jobs" : [
      {
         "subject" : [string],
         "description" : [string],
         "mailTo" : [string],
         "every" : {
                        "seconds": [pattern],
                        "minutes": [pattern],
                        "hours": [pattern],
                        "dayOfMonth": [pattern],
                        "months": [pattern],
                        "dayOfWeek": [pattern]
                   },
         "task" : [string]
      }
   ]
}
```

**Notes:**

  + Only "jobs" and "jobs[].task" are required. If output is only to the console or a file then "mailer" is not necessary.
  + The default for elements in "jobs[].every" is the pattern "*".
  + Only elements with non-default values are necessary in "jobs[].every".
  + "description" elements are useful for providing internal documentation (not available in JSON).
  + If a "mailer" is configured, but you would like to turn it off, set "mailer.active" to false.
  + "jobs[].subject" is used as the subject line in emails.
  + the "jobs[].mailto" can have multiple recipients, each separated by a comma.
  + "timezone" can be any timezone name from the [tz list](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)
  + The schedule for running the task is relative to the specified timezone. 
  + The default timezone is "America/Los_Angeles".


# Usage (basic cron usage)

```bash
crondo.js [options] config.json
```

**Options:**
<pre>
      --version  Show version number                                   [boolean]
  -h, --help     Show information about the app.                       [boolean]
  -v, --verbose  Show information while processing files
                                                      [boolean] [default: false]
  -c, --config   File containing cron configuration and task specifications.
                                                        [string] [default: null]
  -f, --from     From e-mail address. If missing user name in mailer
                 configuration is used as the from address.
                                                        [string] [default: null]
  -o, --output   Write output to a file. Default: console
</pre>

## Example: Say "Hello world!" every minute

**config file: hello.json**

```javascript
{
   "description" : "Hello World example. One task done once a minute.",
   "jobs" : [
      {
         "subject" : "Echo \"Hello world!\" to console",
         "description" : "Echo to console the phrase \"Hello world!\" once a minute.",
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
crondo hello.json
```

There are more examples available in this repository at: [/examples](https://github.com/spase-group/crondo-node/tree/master/examples)

# Cron patterns
The value of time segemnt is specified using cron patterns. 

    All. E.g. *
    Ranges. E.g. 1-3,5
    Steps. E.g. */2

# Cron Ranges

When specifying your cron values you'll need to make sure that your values fall
within the allowed ranges. 

- Seconds: 0-59
- Minutes: 0-59
- Hours: 0-23
- Day of Month: 1-31
- Months: 0-11 (Jan-Dec) also allowed (January-December)
- Day of Week: 0-6 (Sun-Sat) also allowed (Sunday-Saturday)

# Setting Up a Mailer

Crondo uses the "[nodemailer](https://nodemailer.com/)" module to deliver emails. The "mailer" options in 
the crondo config file are the same as for nodemailer, so it is possible to configure the mail transport in 
a range of ways (as described in the nodemailer documentation). Crondo adds a "active" element to the nodemailer
object so the mailer can be easily enabled and disabled.

The simplest mail transport to configure is gmail, which requires a username and an encrypted password. 
If you are using 2FA you will need to create an [Application Specific](https://security.google.com/settings/security/apppasswords) password.

All the examples use gmail as the mailer.

**Note**

Gmail always sets the "From:" email address to the authenticated username.
This means that the setting of "jobs[].from" is ignored.

Gmail has a limit of 500 recipients a day. This is typically sufficient for most uses. 

# Contributions

This is a community effort project. To all that have contributed, Thank You!

# License

Apache 2.0