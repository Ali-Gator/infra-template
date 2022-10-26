const fetch = require('node-fetch');
const exec = require('@actions/exec');

const {RELEASE_VERSION, AUTH_TOKEN, ORG_ID, TICKET_ID} = process.env;

const tag = `rc:${RELEASE_VERSION.split('-')[1]}`;

const addComment = async () => {
  try {
    const response = await fetch(`https://api.tracker.yandex.net/v2/issues/${TICKET_ID}/comments`, {
      method: 'POST',
      headers: {
        Authorization: `OAuth ${AUTH_TOKEN}`,
        'X-Org-ID': ORG_ID,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({text: `Собрали образ с тегом ${tag}`}),
    });

    if (!response.ok) {
      throw Error(response.statusText);
    }
  } catch (e) {
    console.log('There was an error while adding ticket comment', e);
  }
};

const buildDockerImage = async () => {
  try {
    console.log('Building image');
    await exec.exec('docker', ['build', '.', '--file', 'Dockerfile', '--tag', `${tag}`]);
    console.log('Docker image successfully built');
    await addComment();
  } catch (e) {
    console.log('There was an error while building docker image', e);
  }
};

buildDockerImage().then(() => console.log('Ticket successfully updated'));
