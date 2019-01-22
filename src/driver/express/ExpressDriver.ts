import {MethodMetadata} from "../../metadata/MethodMetadata";
import {Method} from "../../Method";
import {ParamMetadata} from "../../metadata/ParamMetadata";
import {BaseDriver} from "../BaseDriver";
import {MethodNotAllowedError} from "../../http-error/MethodNotAllowedError";
import {InvalidParamsError} from "../../rpc-error/InvalidParamsError";
import {MethodNotFoundError} from "../../rpc-error/MethodNotFoundError";

/**
 * Integration with express framework.
 */
export class ExpressDriver extends BaseDriver {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(public express?: any) {
        super();
        this.loadExpress();
        this.app = this.express;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Initializes the things driver needs before routes and middlewares registration.
     */
    initialize() {
        if (this.cors) {
            const cors = require("cors");
            if (this.cors === true) {
                this.express.use(cors());
            } else {
                this.express.use(cors(this.cors));
            }
        }
    }

    /**
     * Registers action in the driver.
     */
    registerMethod(methods: MethodMetadata[], executeCallback: (method: MethodMetadata, options: Method, error?: any) => any): void {

        // middlewares required for this method
        const defaultMiddlewares: any[] = [];

        defaultMiddlewares.push(this.loadBodyParser().json());

        // prepare route and route handler function
        const route = this.routePrefix + "*";
        const routeHandler = function routeHandler(request: any, response: any, next: Function) {
            const options = {request, response, next};
            // todo batch requests
            const method: MethodMetadata = methods.find((methodMetadata) => methodMetadata.fullName === request.body.method);
            if (request.method.toLowerCase() !== "post") {
                return next(method, options, new MethodNotAllowedError());
            } else if (!request.body.params) {
                return executeCallback(method, options, new InvalidParamsError("safa"));

            } else if (!request.body.method || !method) {

                return executeCallback(method, options, new MethodNotFoundError());
            }
            return executeCallback(method, options);
        };

        // finally register method in express
        this.express.use(...[
            route,
            ...defaultMiddlewares,
            routeHandler,
        ]);
    }

    /**
     * Registers all routes in the framework.
     */
    registerRoutes() {
    }

    /**
     * Gets param from the request.
     */
    getParamFromRequest(action: Method, param: ParamMetadata): any {
        const request: any = action.request;
        switch (param.type) {
            case "request-id":
                return request.body.id;

            case "method":
                return request.body.method;

            case "param":
                return request.body.params[param.name];

            case "params":
                return request.body.params;

        }
    }

    /**
     * Handles result of successfully executed controller action.
     */
    handleSuccess(result: any, method: MethodMetadata, options: Method): void {

        // if the method returned the response object itself, short-circuits
        if (result && result === options.response) {
            options.next();
            return;
        }

        // transform result if needed
        result = this.transformResult(result, method, options);

        // apply http headers
        Object.keys(method.headers).forEach(name => {
            options.response.header(name, method.headers[name]);
        });

        if (result === undefined) { // throw NotFoundError on undefined response
            // todo send error
            if (method.undefinedResultCode) {

                options.next();

            } else {
                // throw new NotFoundError();
            }
        } else if (result === null) { // send null response
            // todo send null response
            options.next();
        } else if (result instanceof Buffer) { // check if it's binary data (Buffer)
            options.response.end(result, "binary");
        } else if (result instanceof Uint8Array) { // check if it's binary data (typed array)
            options.response.end(Buffer.from(result as any), "binary");
        } else if (result.pipe instanceof Function) {
            result.pipe(options.response);
        } else { // send regular result
            if (method) {
                options.response.json(result);
            } else {
                options.response.send(result);
            }
            options.next();
        }
    }

    /**
     * Handles result of failed executed controller method.
     */
    handleError(error: any, method: MethodMetadata | undefined, options: Method): any {
        const response: any = options.response;

        // set http code
        // note that we can't use error instanceof HttpError properly anymore because of new typescript emit process

        // apply http headers
        if (method) {
            Object.keys(method.headers).forEach(name => {
                response.header(name, method.headers[name]);
            });
        }

        // send error content
        response.json({
            "json-rpc": "2.0",
            id: options.request.body.id,
            error: this.processJsonError(error, options),
        });
    }

    /**
     * Dynamically loads express module.
     */
    protected loadExpress() {
        if (require) {
            if (!this.express) {
                try {
                    this.express = require("express")();
                } catch (e) {
                    throw new Error("express package was not found installed. Try to install it: npm install express --save");
                }
            }
        } else {
            throw new Error("Cannot load express. Try to install all required dependencies.");
        }
    }

    /**
     * Dynamically loads body-parser module.
     */
    protected loadBodyParser() {
        try {
            return require("body-parser");
        } catch (e) {
            throw new Error("body-parser package was not found installed. Try to install it: npm install body-parser --save");
        }
    }

}
