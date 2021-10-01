#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { HasuraStack } from '../lib/hasura-stack';
import { ActionsStack } from '../lib/actions-stack';

const app = new cdk.App();
const multiAz = false;

const appName = process.env.APP_NAME;
if (!appName) {
    throw Error('APP_NAME must be defined in environment');
}

const region = process.env.AWS_REGION;
if (!region) {
    throw Error('AWS_REGION must be defined in environment');
}

const account = process.env.AWS_ACCOUNT_ID;
if (!account) {
    throw Error('AWS_ACCOUNT_ID must be defined in environment');
}

const env = {
    region,
    account,
};

new HasuraStack(app, `${appName}-HasuraStack`, {
    env,
    appName,
    multiAz,
});

new ActionsStack(app, `${appName}-ActionsStack`, {
    env,
    appName,
});
