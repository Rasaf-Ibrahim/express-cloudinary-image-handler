export default class extendedError extends Error {

    statusCode: number

    constructor(message: string, statusCode: number) {

        super(message)

        this.statusCode = statusCode

        // This is necessary to get the stack trace to point to the correct location
        Object.setPrototypeOf(this, new.target.prototype)
    }
}

