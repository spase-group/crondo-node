# crondo

[![Version](https://badgen.net/npm/v/crondo?icon=npm)](https://badgen.net/npm/v/crondo)
[![Build Status](https://badgen.net/github/status/spase-group/crondo-node?icon=github)](https://badgen.net/github/status/spase-group/crondo-node)
[![Build Checks](https://badgen.net/github/checks/spase-group/crondo-node?icon=github)](https://badgen.net/github/checks/spase-group/crondo-node)
[![Dependency Status](https://badgen.net/npm/dependents/crondo)](https://badgen.net/npm/dependents/crondo)
<!--
[![Code Coverage](https://badgen.net/codecov/c/github/spase-group/crondo-node?icon=codecov)](https://badgen.net/codecov/c/github/spase-group/crondo-node)
[![Known Vulnerabilities](https://snyk.io/test/github/spase-group/crondo-node/badge.svg)](https://snyk.io/test/github/spase-group/crondo-node)
[![Minified size](https://badgen.net/bundlephobia/min/crondo)](https://badgen.net/bundlephobia/min/crondo)
[![Minzipped size](https://badgen.net/bundlephobia/minzip/crondo)](https://badgen.net/bundlephobia/minzip/crondo)
-->
[![monthly downloads](https://badgen.net/npm/dm/crondo?icon=npm)](https://badgen.net/npm/dm/crondo)

Crondo (/krɒn:du:/) is a command line tool to schedule and run tasks with the output written to the console, 
a log file or emailed. The tool runs in the user space and executes tasks in the same space. The tasks to perform, 
the schedule to perform those tasks, the timzone to use and the mail transport to use is defined in a configuration file.

# Installation

    npm install -g crondo

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
         "active" : [boolean],
         "subject" : [string],
         "description" : [string],
         "mailTo" : [string],
         "logAs" : [string],
         "notifyOnly" : [boolean],
         "attachAs" : [string],
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
  + "description" elements are useful for providing internal documentation (not available in JSON).
  + The default for elements in "jobs[].every" is the pattern "*".
  + Only elements with non-default values are necessary in "jobs[].every".
  + A job may be turned off by setting "job[].active" to false. By default a job is active.
  + If a "mailer" is configured, but you would like to turn it off, set "mailer.active" to false.
  + "jobs[].subject" is used as the subject line in emails.
  + the "jobs[].mailto" can have multiple recipients, each separated by a comma.
  + "timezone" can be any timezone name from the [tz list](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)
  + The schedule for running the task is relative to the specified timezone. 
  + if "job[].notifyOnly" is true only the description is emailed, output from task is not sent.
  + "logAs" will write the output of the task in the specified file. Patterns in the file name are replace on each run of the task.
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

# Every Abbreviations

The job[].every element supports cadence abbreviations. Instead of specifying individual time segments (i.e. seconds, minutes, hours, etc.)
you can use one of the following tags.

| Abbreviation           | Description                                                |
|------------------------|------------------------------------------------------------|
| @yearly (or @annually) |	Run once a year at midnight of 1 January                   |
| @monthly               | Run once a month at midnight of the first day of the month |
| @weekly                | Run once a week at midnight on Sunday morning              |
| @daily (or @midnight)	 | Run once a day at midnight                                 |
| @hourly                | Run once an hour at the beginning of the hour              |

For example, the previous example could be run on each hour with the following:

```javascript
{
   "description" : "Hello World example. One task done once a minute.",
   "jobs" : [
      {
         "subject" : "Echo \"Hello world!\" to console",
         "description" : "Echo to console the phrase \"Hello world!\" once a minute.",
         "mailto" : false,
         "every" : "@hourly",
         "task" : "echo \"Hello World!\""
      }
   ]
}
```

# Tokens

The subject and descriptions for emails and the attachment file names can contain tokens that are replaced with values when the task completes.

Supported tokens are:

| Token           | Replaced with                                             |
|-----------------|-----------------------------------------------------------|
| ${date}         | Current date in the defined timezone. Format YYYY-MM-DD   |
| ${time}         | Current time in the defined timezone. Format HHMM.SS.     |

Note: The time format of "HHMM.SS" is slightly non-standard to be compatible with Windows systems.

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

# Running crondo

After creating a configuration file for the tasks, for examp "crontask-weekly.json" you can run the crondo scheduler with the command:

     crondo -v crontask-weekly.json

This will display information in the command window you used to issue the command. This approach can be used to monitor the scheduler. 
It does require the command window to stay connected. You can run the crondo scheduler in the background in a bash shell with the command:

   crondo crontask-weekly.json &> /dev/null &

This will discard any output (&> /dev/null) and run the job in the background.

# Contributions

This is a community effort project. To all that have contributed, Thank You!

# License

Apache 2.0