import { StackProps, Stack, Construct, CfnOutput, RemovalPolicy } from '@aws-cdk/core';
import { Vpc, InstanceType, InstanceClass, InstanceSize, Port, Protocol } from '@aws-cdk/aws-ec2';
import { ApplicationLoadBalancedFargateService } from '@aws-cdk/aws-ecs-patterns';
import { ContainerImage, Secret as ECSSecret } from '@aws-cdk/aws-ecs';
import { Credentials, DatabaseInstance, DatabaseInstanceEngine, DatabaseSecret, PostgresEngineVersion } from '@aws-cdk/aws-rds';
import { Secret } from '@aws-cdk/aws-secretsmanager';

export interface HasuraStackProps extends StackProps {
    appName: string;
    multiAz: boolean;
}

export class HasuraStack extends Stack {
    constructor(scope: Construct, id: string, props: HasuraStackProps) {
        super(scope, id, props);

        const hasuraDatabaseName = props.appName;

        const vpc = new Vpc(this, 'vpc');

        const hasuraDatabase = new DatabaseInstance(this, 'HasuraDatabase', {
            instanceIdentifier: props.appName,
            databaseName: hasuraDatabaseName,
            engine: DatabaseInstanceEngine.postgres({
                version: PostgresEngineVersion.VER_13_3,
            }),
            instanceType: InstanceType.of(InstanceClass.BURSTABLE3, InstanceSize.MICRO),
            credentials: Credentials.fromGeneratedSecret('syscdk'),
            storageEncrypted: true,
            allocatedStorage: 20,
            maxAllocatedStorage: 100,
            vpc,
            deletionProtection: false,
            multiAz: props.multiAz,
            removalPolicy: RemovalPolicy.DESTROY,
        });

        const hasuraUsername = 'hasura';

        const hasuraUserSecret = new DatabaseSecret(this, 'HasuraDatabaseUser', {
            username: hasuraUsername,
            masterSecret: hasuraDatabase.secret,
        });
        hasuraUserSecret.attach(hasuraDatabase); // Adds DB connections information in the secret

        // Output the Endpoint Address so it can be used in post-deploy
        new CfnOutput(this, 'HasuraDatabaseUserSecretArn', {
            value: hasuraUserSecret.secretArn,
        });

        new CfnOutput(this, 'HasuraDatabaseMasterSecretArn', {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            value: hasuraDatabase.secret!.secretArn,
        });

        const hasuraDatabaseUrlSecret = new Secret(this, 'HasuraDatabaseUrlSecret', {
            secretName: `${props.appName}-HasuraDatabaseUrl`,
        });


        new CfnOutput(this, 'HasuraDatabaseUrlSecretArn', {
            value: hasuraDatabaseUrlSecret.secretArn,
        });

        const hasuraAdminSecret = new Secret(this, 'HasuraAdminSecret', {
            secretName: `${props.appName}-HasuraAdminSecret`,
        });

        new CfnOutput(this, 'HasuraAdminSecretArn', {
            value: hasuraAdminSecret.secretArn,
        });

        const hasuraJwtSecret = new Secret(this, 'HasuraJwtSecret', {
            secretName: `${props.appName}-HasuraJWTSecret`,
        });

        new CfnOutput(this, 'HasuraJwtSecretArn', {
            value: hasuraJwtSecret.secretArn,
        });


        // Create a load-balanced Fargate service and make it public
        const fargate = new ApplicationLoadBalancedFargateService(this, 'HasuraFargateService', {
            serviceName: props.appName,
            vpc,
            cpu: 256,
            desiredCount: props.multiAz ? 2 : 1,
            taskImageOptions: {
                image: ContainerImage.fromRegistry('hasura/graphql-engine:v2.0.9'),
                containerPort: 8080,
                enableLogging: true,
                environment: {
                    HASURA_GRAPHQL_ENABLE_CONSOLE: 'true',
                    HASURA_GRAPHQL_PG_CONNECTIONS: '100',
                    HASURA_GRAPHQL_LOG_LEVEL: 'debug',
                },
                secrets: {
                    HASURA_GRAPHQL_DATABASE_URL: ECSSecret.fromSecretsManager(hasuraDatabaseUrlSecret),
                    HASURA_GRAPHQL_ADMIN_SECRET: ECSSecret.fromSecretsManager(hasuraAdminSecret),
                    HASURA_GRAPHQL_JWT_SECRET: ECSSecret.fromSecretsManager(hasuraJwtSecret),
                },
            },
            memoryLimitMiB: 512,
            publicLoadBalancer: true,
            assignPublicIp: true,
        });

        fargate.targetGroup.configureHealthCheck({
            enabled: true,
            path: '/healthz',
            healthyHttpCodes: '200',
        });

        hasuraDatabase.connections.allowFrom(fargate.service, new Port({
            protocol: Protocol.TCP,
            stringRepresentation: 'Postgres Port',
            fromPort: 5432,
            toPort: 5432,
        }));
    }


}
