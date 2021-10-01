# Deploying Hasura using CDK

This repository contains an example of how to deploy Hasura into AWS using [AWS CDK](https://aws.amazon.com/cdk/).

## Infrastructure Layout

Which is to say a multi-az deployment of both Hasura and Postgres. It can be deployed either multi or single AZ with an environment flag.

In addition to the Hasura deployment a simple API gateway with a single function is deployed, this is use to demonstrate the 'actions' feature in Hasura.

## Project Layout

* `cdk` Contains the main CDK stack
* `actions` Contains a simple lambda handler that returns a 'fortune'

## CDK Layout

CDK has been configured into 2 stacks

* `hasura-stack` the main Hasura Fargate and RDS components
* `actions-stack` the API Gateway / Lambda stack for the actions endpoint.

## How to deploy

First copy `.env.example` to `.env` and fill out the properties. They should be fairly obvious:

```
APP_NAME=Whatever you want to call the app, this is used to name the created objects
AWS_REGION=The region to deploy into
AWS_PROFILE=The profile in ~/.aws/credentials to use
AWS_ACCOUNT_ID=The ID of your AWS account
HASURA_ADMIN_SECRET=A secret to use to access the hasura admin interface
HASURA_JWT_SECRET='{"type":"HS256", "key": ""}' - Fill out the 'key' with something with at least 256bit.
HASURA_HOSTNAME=The hostname to use for Hasura, must exist in the hosted zone given above.
ACTIONS_HOSTNAME=The hostname to use for the Actions endpoint, must exist in the hosted zone given above.
```

Then to deploy just do

```
make deploy
```

For destroy do

```bash
make destroy
```

## misc

This project exists as a companion to a talk given at [Hasura Con 2020](https://hasura.io/events/hasura-con-2020/talks/how-to-deploy-hasura-on-aws-using-a-language-you-already-know/). If you intend to use this repository then checking out the talk first might be a good idea.