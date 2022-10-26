import fetch from 'node-fetch';
import {exec} from "@actions/exec";

const {RELEASE_VERSION, AUTHOR, AUTH_TOKEN, ORG_ID, TICKET_ID} = process.env;

const getPrevReleaseNumber = async () => {
  try {
    console.log('Getting previous release number');
    const fullVersionArr = RELEASE_VERSION.split('.');
    const currPatchNumber = fullVersionArr[fullVersionArr.length - 1];
    let prevPatchNumber;
    if (currPatchNumber > 1) {
      prevPatchNumber = `rc-0.0.${currPatchNumber - 1}`;
      console.log('Previous release number: ', prevPatchNumber);
      return prevPatchNumber;
    } else {
      console.log('There is no previous release number');
      return null;
    }
  } catch (e) {
    console.log('There was an error while getting previous release number', e);
  }

};

const getCommits = async (prevReleaseNumber) => {
  try {
    console.log('Getting commits');

    let myOutput = '';
    let myError = '';

    const options = {};
    options.listeners = {
      stdout: (data) => {
        myOutput += data.toString();
      },
      stderr: (data) => {
        myError += data.toString();
      }
    };

    let tags = prevReleaseNumber ? `${prevReleaseNumber}..${RELEASE_VERSION}` : RELEASE_VERSION;
    await exec('git log', ['--pretty=format:"%h %an %s"', tags], options);

    const isError = myError.length > 0;
    if (isError) {
      throw Error('There was an error while taking the commits', myError);
    } else {
      const commits = myOutput.replace(/"/g, '');
      console.log('Commits have founded: ', commits);
      return commits;
    }
  } catch (e) {
    console.log('There was an error while getting commits', e);
  }
};

const ticketUpdate = async () => {
  try {
    const currentRelease = RELEASE_VERSION.split('-')[1];
    const date = new Date().toLocaleDateString();
    const prevRelease = await getPrevReleaseNumber();
    const commits = await getCommits(prevRelease);

    const summary = `Релиз № ${currentRelease} от ${date}`;
    const description = `Ответственный за релиз: ${AUTHOR}
  ________________________
  Коммиты, попавшие в релиз:
  ${commits}`;

    const response = await fetch(`https://api.tracker.yandex.net/v2/issues/${TICKET_ID}`, {
      method: 'PATCH',
      headers: {
        Authorization: `OAuth ${AUTH_TOKEN}`,
        'X-Org-ID': ORG_ID,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({summary, description}),
    });

    if (!response.ok) {
      throw Error(response.statusText);
    }
  } catch (e) {
    console.log('There was an error while ticket update', e);
  }
};

ticketUpdate().then(() => console.log('Ticket successfully updated'));
