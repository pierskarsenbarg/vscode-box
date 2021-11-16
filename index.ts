import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import { Config, Output } from "@pulumi/pulumi";
import { LocalIp } from "./localIp";

const config: Config = new Config("vscode-box");
const publicKey: Output<string> = config.requireSecret("publicKey");

const vpc = new awsx.ec2.Vpc("vs-code-vpc", {
    cidrBlock: "10.0.0.0/24",
    subnets: [{ type: "public", name: "vscode-public" }],
    numberOfAvailabilityZones: 1
});

const localIp = new LocalIp("locaIp");

const sshSG = new aws.ec2.SecurityGroup("sshSG", {
    vpcId: vpc.id,
    ingress: [{
        toPort: 22,
        fromPort: 22,
        protocol: "tcp",
        cidrBlocks: [
            pulumi.interpolate`${localIp.address}/32`
        ]
    }],
    egress: [{
        fromPort: 0,
        toPort: 0,
        protocol: "-1",
        cidrBlocks: ["0.0.0.0/0"]
    }]
});

const amiId = aws.ec2.getAmi({
    filters: [
        {
            name: "name",
            values: ["amzn-ami-hvm-*"],
        },
    ],
    owners: ["137112412989"], // This owner ID is Amazon
    mostRecent: true,
}).then((ami) => ami.id);

const keyPair = new aws.ec2.KeyPair("publicKey", {
    publicKey,
});

const ec2 = new aws.ec2.Instance("instance", {
    instanceType: aws.ec2.InstanceType.T3_Small,
    vpcSecurityGroupIds: [sshSG.id],
    ami: amiId,
    keyName: keyPair.keyName,
    subnetId: pulumi.output(vpc.publicSubnetIds)[0],
    userData: "#!/bin/bash" +
        "sudo yum update -y"
}, { ignoreChanges: ["ami"], protect: false });

export const ip = ec2.publicIp;