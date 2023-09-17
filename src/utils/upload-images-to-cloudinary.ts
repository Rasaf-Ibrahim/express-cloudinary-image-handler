/*__________________________________________

 ✅ import
____________________________________________*/

// built-in node modules 
import fs from 'fs';
import util from 'util';

// types
import { Request } from "express"

// library
import { v2 as cloudinary } from 'cloudinary'

// utils
import extendedError from './extended-error.js';


/*__________________________________________

 ✅ types
____________________________________________*/

type PayloadType = {

    req: Request,

    configuration: {
        ReqBodyFieldName: string

        cloudinaryFolderName: string

        acceptableExtensions: string[]

        acceptableMaximumFileSize: number

        deleteAllTempFiles?: boolean
    }
}


export type UploadedImagesInfoType = {
    imageSrc: string
    imagePublicId: string
}[]



type UploadReportType = {
    isError: boolean,
    errorInfo: {
        statusCode?: number | null,
        message?: string | null
    },
    imagesInfo: UploadedImagesInfoType
}



/*__________________________________________

 ✅ util
____________________________________________*/

export default async function uploadImagesToCloudinary(payload: PayloadType): Promise<UploadReportType> {


    // Payload
    const {
        req,
        configuration
    } = payload

    const {
        deleteAllTempFiles = true
    } = configuration


    // Initializing the upload report which we will return from this function
    let uploadReport: UploadReportType = {
        isError: false,
        errorInfo: {
            statusCode: 500,
            message: ''
        },
        imagesInfo: []
    }

    // Initializing variables which will collect info for generating a good error message 
    let failedToDeleteFilesPath: string[] = []
    let failedToUploadFilesCount = 0


    try {

        /* Image Upload Step-1: checking if any file is uploaded or not and uploading file with the right property name or not*/
        // validation - no file is uploaded
        if (!req.files) {

            throw new extendedError('You have not uploaded any file', 404)
        }


        /* Image Upload Step-2: if we are in this step, that means at least a file is temporarily uploaded on the server. Getting the temporarily uploaded files */
        let temporarilyUploadedFiles = req.files[configuration.ReqBodyFieldName]


        /* Image Upload Step-3:  If 'temporarilyUploadedFiles' is not an array, turning it into an array. */

        /* 🔖 When we have only one image, the req.files object returns an object, not an array, and thus we cannot use array methods (like .length) on it. To solve this problem, we are checking that the 'temporarilyUploadedFiles' is an array, and if it's not, we are converting it into an array */

        if (!Array.isArray(temporarilyUploadedFiles)) {
            temporarilyUploadedFiles = [temporarilyUploadedFiles]
        }


        /* Image Upload Step-4: Checking if the frontend dev has used wrong property key while uploading  */
        if (!req.files[configuration.ReqBodyFieldName]) {

            throw new extendedError(`No file has correct field name. The field name has to be ${configuration.ReqBodyFieldName}`, 404)
        }


        /* Image Upload Step-5: The following loop will validate the images, upload the images to the cloudinary */
        for (const temporarilyUploadedFile of temporarilyUploadedFiles) {


            /* Image Upload Step-5.1: validating the image with different conditions*/

            // Validation - image or not
            if (!temporarilyUploadedFile.mimetype.startsWith('image')) { 

                throw new extendedError('You are trying to upload a file which is not a image', 415)
            }


            // Validation - image format
            const image_format = temporarilyUploadedFile.name.split(".").pop()

            if (!configuration.acceptableExtensions.includes(image_format)) {

                throw new extendedError(`File must have one of the following extensions: ${configuration.acceptableExtensions.join(', ')}`, 415)
            }


            // validation - fileSize
            const fileSize = temporarilyUploadedFile.size / 1024

            if (fileSize > configuration.acceptableMaximumFileSize) {

                throw new extendedError(`File size must be lower than ${configuration.acceptableMaximumFileSize}kb`, 406)
            }

        }


        /* Image Upload Step-6: Create promises for every single image which we want to upload */
        const uploadPromises = temporarilyUploadedFiles.map(async (temporarilyUploadedFile) => {

            try {

                /* To upload an image, cloudinary needs a temporary path of the image from the server. So, let's first get that*/
                const image_temp_path = temporarilyUploadedFile.tempFilePath;

                const uploaded_image_on_cloudinary = await cloudinary.uploader.upload(

                    // temporary image's path
                    image_temp_path,

                    {
                        /*🔖 on cloudinary, the image would get uploaded in a folder, specifying that folder.  */
                        folder: configuration.cloudinaryFolderName,

                        /*🔖 when we upload the image temporarily with the 'express-fileUpload' library in the server, it gets uploaded to the 'temp' folder and also gets a new name automatically. We don't want that name in cloudinary. If we make the following property true, then the image name in cloudinary would be same to the temporary image file name. So, we are making it false.  */
                        use_filename: false,

                        /*🔖 By default, the following property is true and if it's true, cloudinary adds some unique random text with the original image file name. 
                        
                        As we are not having the original name by setting 'use_filename:false', the random unique text generated from this property will be the image name. */
                        unique_filename: true,

                        /*🔖 As every new image will have a unique name, overwriting is not possible, so let's set overwrite: false*/
                        overwrite: false,
                    }
                )

                /* creating an object with the uploaded image's info*/
                const uploaded_image_info = {
                    imageSrc: uploaded_image_on_cloudinary.secure_url,
                    imagePublicId: uploaded_image_on_cloudinary.public_id
                }

                /* Pushing the "uploaded_image_info" in the "uploadReport.imagesInfo" array */
                uploadReport.imagesInfo.push(uploaded_image_info)

            }

            catch (error) {
                // updating the "failedToUploadFilesCount"
                failedToUploadFilesCount = failedToUploadFilesCount + 1;
            }
        })


        /* Image Upload Step-7: Uploading all the images and checking for error */
        await Promise.allSettled(uploadPromises)

        // if any error has occurred while uploading any image
        if (failedToUploadFilesCount > 0) {

            throw new extendedError(`Failed to upload ${failedToUploadFilesCount} images.`, 500)
        }
    }


    catch (error) {
        uploadReport.isError = true;
        uploadReport.errorInfo = {
            statusCode: error.statusCode,
            message: error.message 
        }
    }


    finally {

        // Function to delete files
        const deleteFiles = async (filesToDelete) => {
            // Promisify the fs.unlink 
            const unlinkAsync = util.promisify(fs.unlink)
            

            // Ensure filesToDelete is an array
            const files = Array.isArray(filesToDelete) ? filesToDelete : [filesToDelete]
    

            // Create an array of promises for the file deletions
            const deletionPromises = files.map(file => 
                unlinkAsync(file.tempFilePath).catch(error => {
                    failedToDeleteFilesPath.push(file.tempFilePath)
                })
            )
    

            // Await all deletion promises to settle
            await Promise.allSettled(deletionPromises)
    

            // Handle any failed deletions
            if (failedToDeleteFilesPath.length > 0) {
                uploadReport.isError = true
                uploadReport.errorInfo.statusCode = 500
    
                // Modify the original message to include failure details
                uploadReport.errorInfo.message = `${uploadReport.errorInfo.message} Failed to delete temporarily uploaded files, their paths: ${failedToDeleteFilesPath.join(', ')}.`
            }
        }


        // Function to delete files (files which has been uploaded temporarily by "express-fileUpload" package)
        const deleteTemporarilyUploadedFiles = async () => {
          
            // Check if req.files exists
            if (!req.files) return
        

            // Delete all temporarily uploaded files, regardless of their type or the field name used for uploading
            if (deleteAllTempFiles) {

                const fileKeys = Object.keys(req.files)

                const allFiles = []
        
                // Iterate over all keys in the req.files object and collect all files into a single array
                for (const key of fileKeys) {

                    const fileArray = req.files[key] 

                    if (Array.isArray(fileArray)) {
                        allFiles.push(...fileArray)
                    } 

                    else {
                        allFiles.push(fileArray)
                    }
                }
        
                // Pass the array containing all files to the deleteFiles function
                await deleteFiles(allFiles)
            } 

            // Delete only the temporarily uploaded files which were uploaded with the right field name
            else {
                const fileArray = req.files[configuration.ReqBodyFieldName]
                await deleteFiles(fileArray)
            }

        }
        
        await deleteTemporarilyUploadedFiles()

        return uploadReport
    }
}





