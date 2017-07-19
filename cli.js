#!/usr/bin/env node

'use strict';

const https = require('https');
const fs = require('fs');
const os = require('os');
const dns = require('dns');
const fse = require('fs-extra');
const got = require('got');
const chalk = require('chalk');
const cheerio = require('cheerio');
const logUpdate = require('log-update');
const ora = require('ora');
const updateNotifire = require('update-notifier');
const pkg = require('./package.json');

updateNotifire({pkg}).notify();

const spinner = ora();
const pre = chalk.cyan.bold('›');
const pos = chalk.red.bold('›');
const arg = process.argv[2];
const inf = process.argv[3];
const dir = `${os.homedir()}/Astronomy-Pictures/`;

if (!arg || arg === '-h' || arg === '--help') {
	console.log(`
 Usage: apod <command>

 Commands:
  -t, ${chalk.dim('--today')}     Download Astronomy Picture of the Day
  -d, ${chalk.dim('--date')}      Download Astornomy Picture from the specific date

 Help:
  -e, ${chalk.dim('--example')}   Show example
 `);
	process.exit(1);
}

const showMessage = () => {
	console.log(`
 Downloading Astronomy Picture of:

 ${pre} 31st December 1998 [31/12/98]
 ${pre} 1st January 2000   [01/01/00]

 $ apod --d ${chalk.green('98')}${chalk.red('12')}${chalk.cyan('31')}
 $ apod --d ${chalk.green('00')}${chalk.red('01')}${chalk.cyan('01')}

 Date Format:

 ${pre} yy/mm/dd
		`);
	process.exit(1);
};

if (arg === '-e' || arg === '--example') {
	showMessage();
}

fse.ensureDir(dir, err => {
	if (err) {
		process.exit(1);
	}
});

const checkConnection = () => {
	dns.lookup('apod.nasa.gov', err => {
		if (err) {
			logUpdate(`\n ${pos} Please check your Internet Connection \n`);
			process.exit(1);
		} else {
			logUpdate();
			spinner.text = `Trying to contact the Alines!`;
			spinner.start();
		}
	});
};

const linkSplitter = data => {
	return data.split('<a href="image')[1].split('"')[0];
};

const downloadImage = (imageSource, picture) => {
	const save = fs.createWriteStream(`${dir}${picture}`);

	https.get(imageSource, (res, cb) => {
		res.pipe(save);

		save.on('finish', () => {
			save.close(cb);
			logUpdate(`\n${pre} Transferred ~ ${chalk.dim(`[ ${picture.split('-').join(' ').split('.')[0]} ]`)}\n`);
			spinner.stop();
			save.on('error', () => {
				process.exit(1);
			});
		});
	});
};

const displayError = () => {
	logUpdate(`\n${pos} God destroyed all the galaxies!\n`);
	process.exit(1);
};

const aliens = () => {
	logUpdate();
	spinner.text = 'Woot Woot. We are sending you the image!';
};

if (arg === '-t' || arg === '--today') {
	checkConnection();
	got('https://apod.nasa.gov/apod/').then(res => {
		aliens();
		const $ = cheerio.load(res.body);
		const aboutImage = `${$('center').eq(1).text().split('\n')[1].trim().split(' ').join('-')}.jpg`;
		const link = linkSplitter(res.body);
		const fullUrl = `https://apod.nasa.gov/apod/image${link}`;

		downloadImage(fullUrl, aboutImage);
	}).catch(err => {
		if (err) {
			displayError();
		}
	});
}

if (arg === '-d' || arg === '--date') {
	if (!inf) {
		console.log(` \n ${pos} Provide a valid date, human!\n`);
		console.log('==================================');
		showMessage();
	}
	checkConnection();
	got(`https://apod.nasa.gov/apod/ap${inf}.html`).then(res => {
		aliens();
		const $ = cheerio.load(res.body);
		const link = linkSplitter(res.body);
		const imageName = `${$('title').text().split('-')[1].trim().split(' ').join('-')}.jpg`;
		const sourceLink = `https://apod.nasa.gov/apod/image${link}`;

		downloadImage(sourceLink, imageName);
	}).catch(err => {
		if (err) {
			displayError();
		}
	});
}
