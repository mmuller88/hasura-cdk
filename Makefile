define HELP

Usage:

make build                          - Build
make deploy                        - Deploy

endef

export HELP

EXECUTION_DATE:=$(shell date +'%Y%m%d%H%M')

include .env

all help:
	@echo "$$HELP"

dependencies:
	cd actions; npm install
	cd cdk; npm install

build: dependencies build-actions build-cdk

build-actions:
	cd actions; npm run build

build-cdk:
	cd cdk; npm run build

deploy: build deploy-cdk post-deploy-cdk

deploy-cdk:
	cd cdk; AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID} AWS_REGION=${AWS_REGION} APP_NAME=${APP_NAME} npx cdk deploy '*'  --outputs-file cdk.outputs.json

destroy:
	cd cdk; AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID} AWS_REGION=${AWS_REGION} APP_NAME=${APP_NAME} npx cdk destroy '*' 

post-deploy-cdk:
	@cd cdk; AWS_REGION=${AWS_REGION} APP_NAME=${APP_NAME} HASURA_ADMIN_SECRET=${HASURA_ADMIN_SECRET} HASURA_JWT_SECRET=${HASURA_JWT_SECRET} npx ts-node bin/post-deploy.ts