import {Method} from "../../Method";
import {MethodMetadata} from "../MethodMetadata";

/**
 * Method metadata used to storage information about registered method.
 */
export interface MethodMetadataArgs {

    /**
     * Name to be registered for the method.
     */
    name: string|RegExp;

    /**
     * Class on which's method this method is attached.
     */
    target: Function;

    /**
     * Object's method that will be executed on this method.
     */
    method: string;

    /**
     * Params to be appended to the method call.
     */
    appendParams?: (method: Method) => any[];

    /**
     * Special function that will be called instead of orignal method of the target.
     */
    methodOverride?: (methodMetadata: MethodMetadata, method: Method, params: any[]) => Promise<any>|any;

}