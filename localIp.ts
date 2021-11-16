import { ComponentResource, ComponentResourceOptions, output, Output } from "@pulumi/pulumi";
import * as publicIp from "public-ip";

export class LocalIp extends ComponentResource {
    public readonly address: Output<string>;
    constructor(name: string, opts?: ComponentResourceOptions) {
        super("x:index:LocalIp", name, opts);

        this.address = output(publicIp.v4());

        this.registerOutputs({
            address: this.address
        });
    }
}