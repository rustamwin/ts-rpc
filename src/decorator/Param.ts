import {getMetadataArgsStorage} from "../index";
import {ParamOptions} from "../decorator-options/ParamOptions";

export function Param(name: string, options?: ParamOptions): Function {
    return function (object: Object, methodName: string, index: number) {
        getMetadataArgsStorage().params.push({
            type: "param",
            object: object,
            method: methodName,
            index: index,
            name: name,
            parse: false,
            required: options ? options.required : undefined,
            classTransform: options ? options.transform : undefined,
            validate: options ? options.validate : undefined,
            explicitType: options ? options.type : undefined,
            extraOptions: options ? options.options : undefined
        });
    };
}