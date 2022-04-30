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
const path = require('path');
const yargs = require('yargs');
const nodemailer = require('nodemailer');
const CronJob = require('cron').CronJob;
const { exec } = require('child_process');

// Configure the app
var options  = yargs
	.version('0.1.3')
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
			describe : 'Show information while processing files',
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
         describe : 'Write output to a file. Default: console',
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
var timezone = null; // "America/Los_Angeles";

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
var sendmail = function(from, to, subject, message, attachments) {
   if( ! transporter) { outputWrite("No mail transporter defined. Unable to send email."); return; }
  
   var mailOptions = {
      from: from,
      to: to,
      subject: replaceTokens(subject),
      text: message,
      attachments: attachments
   };

   if(options.verbose) {
      outputWrite("Sending:")
      outputWrite(mailOptions);
   }

   transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
         console.error(error);
      } else {
         console.log('Email sent: ' + info.response);
         // remove attachment
         if(attachments) { // Remove files
            for(let i = 0; i < attachments.length; i++) {
               fs.unlinkSync(attachments[i].pathname);
            }
         }
      }
   });
}

/** 
 * Replace tokens in a string.
 *
 * Token        Replaced with
 * ${date}      Current date in YYYY-MM-DD format
 * ${time}      Current time in HHMM.SS format
 **/
var replaceTokens = function(text) {
   const now = new Date(Date().toLocaleString("en-US", { timeZone: timezone }));
   
   // Create YYYY-MM-DD format
   let datestamp = now.getFullYear()
                  + "-" 
                  + ("0" + (now.getMonth() + 1)).slice(-2)
                  + "-" 
                  + ("0" + (now.getDate())).slice(-2)
  
   let timestamp = ("0" + (now.getHours() + 1)).slice(-2)
                  + ("0" + (now.getMinutes() + 1)).slice(-2)
                  + "." 
                  + ("0" + (now.getSeconds())).slice(-2)
  
   return text.replace(/\${date}/g, datestamp).replace(/\${time}/g, timestamp);   // Replace "${date}" with current date
}

/** 
 * Write content to a file and return name of file.
 **/
var createAttachment = function(pattern, content) {
   let filename = replaceTokens(pattern);
   try {
      // Do we need safe gaurds about name and path??
      fs.writeFileSync(filename, content);
   } catch(e) {
      console.error(e.message);
   }
   
   return filename;
}

/** 
 * Report on the results of running a task. This will write to the console, a file or send email based on job configuration.
 **/
var report = function(job, content, suffix) {
   let body = "";
   let attachment = null;
   let attachments = null;
   
   if(job.description) body = replaceTokens(job.description);
   
   if(job.logAs) {   // Write content into file
      attachment = createAttachment(job.logAs, content);
   }
   
   if(job.mailTo) {  // Send email
      if(transporter) {
         if( ! job.notifyOnly) { // Attach or include output
            if(job.attachAs) {   // Write content into file
               attachment = createAttachment(job.attachAs, content);
               attachments = [
                    {   // stream as an attachment
                        pathname : attachment,  // Our custom payload
                        filename: path.basename(attachment),
                        content: fs.createReadStream(attachment)
                    }
              ]
            } else {
               body += content;
            }            
         }
         sendmail((job.from ? job.from : options.from), job.mailTo, replaceTokens(job.subject) + suffix, body, attachments);
      } else {
         if( ! transporter) outputWrite('Warning: Mail transporter not configured, but a mailTo is specified.');
      }
   } else { // Write to output (console or file)
      outputWrite(content);
   }
}

/** 
 * Convert a month cron field if it contains month names.
 * Long and short (3-letter) month names are converted to month number
 * January is month number 0.
 **/
var convertMonths = function(text) {
   text = text.toLowerCase();  // Normalize text 
   
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
var convertDayOfWeek = function(text) {
   text = text.toLowerCase();  // Normalize text 
   
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
   
   // A little fix - if time segment specified, make any unspecified more frequent segment 0.
   if( typeof job.every.months !== 'undefined' && job.every.months !== null ) { // Defined
      if( typeof job.every.hours === 'undefined' ) job.every.hours = 0;
      if( typeof job.every.minutes === 'undefined' ) job.every.minutes = 0;
      if( typeof job.every.seconds === 'undefined' ) job.every.seconds = 0;
   }
   if( typeof job.every.hours !== 'undefined' && job.every.hours !== null ) { // Defined
      if( typeof job.every.minutes === 'undefined' ) job.every.minutes = 0;
      if( typeof job.every.seconds === 'undefined' ) job.every.seconds = 0;
   }
   if( typeof job.every.minutes !== 'undefined' && job.every.minutes !== null ) { // Defined
      if( typeof job.every.seconds === 'undefined' ) job.every.seconds = 0;
   }
   
   // Now create "cron" schedule
   if (typeof job.every === 'string' || job.every instanceof String) {  // If a token
      if(job.every == "@yearly" || job.every == "@annually") return("0 0 0 1 1 *");
      if(job.every == "@monthly") return("0 0 0 1 * *");
      if(job.every == "@weekly") return("0 0 0 * * 0");
      if(job.every == "@daily" || job.every == "@midnight") return("0 0 0 * * *");
      if(job.every == "@hourly") return("0 0 * * * *");     
   } else { // Build up based on what is present
      if( typeof job.every.seconds === 'undefined' )    { onTick += "*"; } else { onTick += job.every.seconds;    }; onTick += " ";
      if( typeof job.every.minutes === 'undefined' )    { onTick += "*"; } else { onTick += job.every.minutes;    }; onTick += " ";
      if( typeof job.every.hours === 'undefined' )      { onTick += "*"; } else { onTick += job.every.hours;      }; onTick += " ";
      if( typeof job.every.dayOfMonth === 'undefined' ) { onTick += "*"; } else { onTick += job.every.dayOfMonth; }; onTick += " ";
      if( typeof job.every.months === 'undefined' )     { onTick += "*"; } else { onTick += convertMonths(job.every.months); }; onTick += " ";
      if( typeof job.every.dayOfWeek === 'undefined' )  { onTick += "*"; } else { onTick += convertDayOfWeek(job.every.dayOfWeek); }
   }
   
   if(options.verbose) console.log("onTick: " + onTick);
   return onTick;
}

/**
 * Show the job queue
 **/
var showQueue = function(jobs) {
   if( ! jobs ) return;
   for(let i = 0; i < jobs.length; i++) {
      let job = jobs[i];
      console.log(job.subject);
      console.log(job.proc.lastDate());
      console.log(job.proc.nextDate());
   }
}

/**
 * Application entry point.
 **/
var main = async function(args)
{
	if (options.config == null && args.length == 0) {
	  yargs.showHelp();
	  return;
	}
   
	// Output
	if(options.output) {
		outputFile = fs.createWriteStream(options.output);
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
	
   // Set-up 
   if(config.mailer && config.mailer.active) {      
      if(options.verbose) {
         outputWrite("Setting up mailer ...")   
         outputWrite(JSON.stringify(config.mailer, null, 3));
      }
      try {
         // Create mail transporter
         transporter = nodemailer.createTransport(config.mailer);
         /*
         transporter = nodemailer.createTransport({
            service: config.mailer.service,
            auth: {
              user: config.mailer.auth.user,
              pass: config.mailer.auth.password
            }
         });
         */
         
         if(options.from == null) {  // If by not set, 
           options.from = config.mailer.user;
         }
      } catch (e) {
         outputWrite(e.message);
         return;
      }
   }
  
   // Set defaults
   if( config.timezone ) { timezone = config.timezone; }
   
   if( ! config.jobs ) {
      outputWrite("Error: No jobs defined are defined. Nothing will be done.");
      return;
   }
   
   // Create each job
   if(options.verbose) { outputWrite("Creating jobs..."); }
   
   for(let i = 0; i < config.jobs.length; i++) {
      let job = config.jobs[i]
      if(job.active !== undefined && ! job.active) { job.proc = null; continue; } // Don't create job
      if(options.verbose) { outputWrite("Defining: "); outputWrite(job); }
      job.proc = new CronJob(getSchedule(job), function() {
         const subprocess = exec(job.task, 
            (error, stdout, stderr) => {
               if (error) {
                  report(job, error, ": Error occurred");
               } else { // It ran OK
                  report(job, stdout + stderr, "");
               }
            },
            null,
            false,
            timezone
         );
      });
   }
  
   // Start each job
   if(options.verbose) { outputWrite("Starting all jobs..."); }
   for(let i = 0; i < config.jobs.length; i++) {
      let job = config.jobs[i]
      if(job.proc) job.proc.start();
   }    
}

main(args);
