import { Request } from "express";


export interface type_of_request_with_files extends Request {
    files: any 
}
