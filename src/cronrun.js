#!/usr/bin/env node
"use strict";
/*eslint-disable no-console*/
/** 
   Command line tool to schedule and run tasks.
 
   Development funded by NASA.
 
   author: Todd King
   version: 1.00 2022-04-04
**/
const fs = require('fs');
const yargs = require('yargs');
const nodemailer = require('nodemailer');
const CronJob = require('cron').CronJob;
const { exec } = require('child_process');

// Configure the app
var options  = yargs
	.version('1.0.0')
	.usage('Command line tool to schedule and run tasks.\n\nUsage:\n\n$0 [args] crontab.json')
	.example('$0 example.json', 'Run tasks on the schedule defined in example.json')
	.epilog("Development funded by NASA's HPDE project at UCLA.")
	.showHelpOnFail(false, "Specify --help for available options")
	.help('h')
	
	// version
	.options({
		// help text
		'h' : {
			alias : 'help',
			description: 'Show information about the app.'
		},
    
		'v' : {
			alias: 'verbose',
			describe : 'show information while processing files',
			type: 'boolean',
			default: false
		},

      // Config file
      'c' : {
         alias: 'config',
         describe : 'File containing cron configuration and task specifications.',
         type: 'string',
         default: null
      },

      // From e-mail address for the email message.
      'f' : {
         alias: 'from',
         describe : 'From e-mail address. If missing user name in mailer configuration is used as the from address.',
         type: 'string',
         default: null
      },
      
      // Write output to a file
      'o' : {
         alias: 'output',
         describe : 'Write output to a file. Default: to standard out',
         type: 'string',
         default: null
      },

   })
   .argv
   ;

// Globals
var args = options._;	// Remaining non-hyphenated arguments
var outputFile = null;	// None defined.

var transporter = null; // Email transporter

/**
 * Write text to the choosen output stream.
 **/
var outputWrite = function(str) {
	if(outputFile == null) {
		console.log(str);
	} else {
		outputFile.write(str);
	}
}

/**
 * Close an output file if one is assigned.
 **/
var outputEnd = function() {
	if(outputFile) { outputFile.end(); outputFile = null }
}

/** 
 * Send email to the designated destination
 **/
var sendmail = function(from, to, subject, message) {
   if( ! transporter) { outputWrite("No mail transporter defined. Unable to send email."); return; }
  
   var mailOptions = {
      from: from,
      to: to,
      subject: subject,
      text: message,
      attachments: null
   };

   if(options.verbose) {
      outputWrite("Sending:")
      outputWrite(mailOptions);
   }

   transporter.sendMail(mailOptions, function(error, info){
      if (error) {
         outputWrite(error);
      } else {
         outputWrite('Email sent: ' + info.response);
      }
   });
}

/** 
 * Convert a month cron field if it contains month names.
 * Long and short (3-letter) month names are converted to month number
 * January is month number 0.
 **/
var convertMonths = function(text) {
   text = text.toLower();  // Normalize text 
   
   // Do long names first
   text = text.replace(/january/g, 0);
   text = text.replace(/february/g, 1);
   text = text.replace(/march/g, 2);
   text = text.replace(/april/g, 3);
   text = text.replace(/may/g, 4);
   text = text.replace(/june/g, 5);
   text = text.replace(/july/g, 6);
   text = text.replace(/august/g, 7);
   text = text.replace(/september/g, 8);
   text = text.replace(/october/g, 9);
   text = text.replace(/november/g, 10);
   text = text.replace(/december/g, 11);

   // Now do short names first
   text = text.replace(/jan/g, 0);
   text = text.replace(/feb/g, 1);
   text = text.replace(/mar/g, 2);
   text = text.replace(/apr/g, 3);
   text = text.replace(/may/g, 4);
   text = text.replace(/jun/g, 5);
   text = text.replace(/jul/g, 6);
   text = text.replace(/aug/g, 7);
   text = text.replace(/sep/g, 8);
   text = text.replace(/oct/g, 9);
   text = text.replace(/nov/g, 10);
   text = text.replace(/dec/g, 11);
   
   return text; 
}

/** 
 * Convert a day cron field if it contains day names.
 * Long and short (3-letter) day names are converted to day number
 * Monday is day number 0.
 **/
var convertMonths = function(text) {
   text = text.toLower();  // Normalize text 
   
   // Do long names first
   text = text.replace(/monday/g, 0);
   text = text.replace(/tuesday/g, 1);
   text = text.replace(/wednesday/g, 2);
   text = text.replace(/thursday/g, 3);
   text = text.replace(/friday/g, 4);
   text = text.replace(/saturday/g, 5);
   text = text.replace(/sunday/g, 6);

   // Now do short names first
   text = text.replace(/mon/g, 0);
   text = text.replace(/tue/g, 1);
   text = text.replace(/wed/g, 2);
   text = text.replace(/thu/g, 3);
   text = text.replace(/fri/g, 4);
   text = text.replace(/sat/g, 5);
   text = text.replace(/sun/g, 6);
   
   return text;
}

/** 
 * Create a schedule string from job specification.
 * Format of job spec is
 * ┌────────────── second (optional)
 * │ ┌──────────── minute
 * │ │ ┌────────── hour
 * │ │ │ ┌──────── day of month
 * │ │ │ │ ┌────── month
 * │ │ │ │ │ ┌──── day of week
 * │ │ │ │ │ │
 * │ │ │ │ │ │
 * * * * * * *
 * 
 * For month you can use month number or names. For example: Jan, Feb, Mar
 * For day or week you can use day names. For example: Monday, Tuesday, etc.
 **/
var getSchedule = function(job) {
   if( ! job) return "";
  
   var onTick = "";
   
   if(job.every.seconds)    { onTick += job.every.seconds;    } else { onTick += "*"; }; onTick += " ";
   if(job.every.minutes)    { onTick += job.every.minutes;    } else { onTick += "*"; }; onTick += " ";
   if(job.every.hours)      { onTick += job.every.hours;      } else { onTick += "*"; }; onTick += " ";
   if(job.every.dayOfMonth) { onTick += job.every.dayOfMonth; } else { onTick += "*"; }; onTick += " ";
   if(job.every.months)     { onTick += convertMonths(job.every.months);     } else { onTick += "*"; }; onTick += " ";
   if(job.every.dayOfWeek)  { onTick += convertDayOfWeek(job.every.dayOfWeek);  } else { onTick += "*"; }

   outputWrite("onTick: " + onTick);
   return onTick;
}

/**
 * Application entry point.
 **/
var main = async function(args)
{

	if (options.crontab == null && args.length == 0) {
	  yargs.showHelp();
	  return;
	}
   
	// Output
	if(options.output) {
		outputFile = fs.createWriteStream(options.output);
		// outputWrite(0, 'datacite:');
	}

  // Set contab file name. Priority is if passed as option.
	var pathname = (options.config ? options.config : args[0]);

   // Parse cron config file
   var config = null;
   try {
      config = JSON.parse(fs.readFileSync(pathname));
   } catch (e) {
      outputWrite(e.message);
      return;
   }  
	
   if(config.mailer && config.mailer.active) {       
      try {
         // Create mail transporter
         transporter = nodemailer.createTransport({
            service: config.mailer.service,
            auth: {
              user: config.mailer.user,
              pass: config.mailer.password
            }
         });

         if(options.from == null) {  // If by not set, 
           options.from = config.mailer.user;
         }
      } catch (e) {
         outputWrite(e.message);
         return;
      }
   }
  
   // Set defaults
   if( ! config.timezone ) { config.timezone = "America/Los_Angeles" }
   
   if( ! config.jobs ) {
      outputWrite("Error: No jobs defined are defined. Nothing will be done.");
      return;
   }
   
   // Create each job
   if(options.verbose) { outputWrite("Creating jobs..."); }
   
   for(let i = 0; i < config.jobs.length; i++) {
      let job = config.jobs[i]
      if(options.verbose) { outputWrite("Defining: "); outputWrite(job); }
      job.proc = new CronJob(getSchedule(job), function() {
         const subprocess = exec(job.task, 
            (error, stdout, stderr) => {
               if (error) {
                  if(job.mailTo) {
                     if(transporter) {
                        sendmail(options.from, job.mailTo, "Error running: " + job.subject + ": error occurred.", error);
                        return;
                     } else {
                        if( ! transporter) outputWrite('Warning: Mail transporter not configured');
                     }
                  }
                  outputWrite(error);
               } else { // It ran OK
                  if(job.mailTo) {
                     if(transporter) {
                        sendmail(options.from, job.mailTo, "Output from: " + job.subject, stdout + stderr);
                        return;
                     } else {
                        outputWrite('Warning: Mail transporter not configured.');
                     }
                  }
                  if(options.verbose) { if(job.subject) outputWrite(job.subject); if(job.description) outputWrite(job.description); outputWrite("--- output ---"); }
                  outputWrite(stdout);
                  outputWrite(stderr);
                  if(options.verbose) { outputWrite("--------------"); }
               }
            },
            null,
            false,
            config.timezone
         );
      });
   }
  
   // Start each job
   if(options.verbose) { outputWrite("Starting all jobs..."); }
   for(let i = 0; i < config.jobs.length; i++) {
      var job = config.jobs[i]
      job.proc.start();
   }    
}

main(args);
