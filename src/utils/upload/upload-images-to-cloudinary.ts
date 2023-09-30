/*__________________________________________

 ✅ import
____________________________________________*/

// built-in node modules 
import fs from 'fs';
import util from 'util';

// types
import { Request } from "express"

// library
import { cloudinary } from '../../dependencies/cloudinary.js'

// utils
import extendedError from '../extended-error.js';
import handleCloudinaryConfigErrors from '../cloudinary-config-errors.js';



/*__________________________________________

 ✅ types
____________________________________________*/

type PayloadType = {

    req: Request,

    configuration: {
        formDataFieldName: string

        cloudinaryFolderName: string

        allowedExtensions?: string[]

        maxFileSizeInKB?: number

        maxNumberOfUploads?: number

        deleteAllTempFiles?: boolean,

        useSourceFileName?: boolean
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
        deleteAllTempFiles = true,
        useSourceFileName = false
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
    let cloudinaryErrorMessage = ''


    try {


        /* Image Upload Step-1: checking if any file is uploaded or not */
        if (!req.files) {

            throw new extendedError('You have not uploaded any file', 404)
        }


        /* Image Upload Step-2: if we are in this step, that means at least a file is temporarily uploaded on the server. Getting the temporarily uploaded files */
        let temporarilyUploadedFiles = req.files[configuration.formDataFieldName]



        /* Image Upload Step-3:  If 'temporarilyUploadedFiles' is not an array, turning it into an array. */

        /* 🔖 When we have only one image, the req.files object returns an object, not an array, and thus we cannot use array methods (like .length) on it. To solve this problem, we are checking that the 'temporarilyUploadedFiles' is an array, and if it's not, we are converting it into an array */

        if (!Array.isArray(temporarilyUploadedFiles)) {
            temporarilyUploadedFiles = [temporarilyUploadedFiles]
        }


       
        /* Image Upload Step-4: Checking if the frontend dev has used wrong property key for every single file  */
        if (!req.files[configuration.formDataFieldName]) {

            throw new extendedError(`No file has correct field name. The field name has to be ${configuration.formDataFieldName}`, 404)
        }


        /* Image Upload Step-5: Checking if the user has tried to upload more files than he is allowed to  */
        if (temporarilyUploadedFiles.length > configuration.maxNumberOfUploads) {

            const image = configuration.maxNumberOfUploads === 1 ? 'image' : 'images'

            throw new extendedError(`You can't upload more than ${configuration.maxNumberOfUploads} ${image}.`, 400)
        }


        

        /* Image Upload Step-6: The following loop will validate the images */
        for (const temporarilyUploadedFile of temporarilyUploadedFiles) {


            // Validation - image or not
            if (!temporarilyUploadedFile.mimetype.startsWith('image')) {

                throw new extendedError('You are trying to upload a file which is not a image', 415)
            }


            // Validation - image format
            if(configuration.allowedExtensions) {

                const image_format = temporarilyUploadedFile.name.split(".").pop()


                // only if the image has format, checking the format is possible (sometime, by changing the name of the image file in the formData, the format can go missing)
                if(image_format) {

                    if (!configuration.allowedExtensions.includes(image_format)) {
    
                        throw new extendedError(`File must have one of the following extensions: ${configuration.allowedExtensions.join(', ')}`, 415)
                    }
                }
    
            }
         
      
            // validation - fileSize
            if(configuration.maxFileSizeInKB) {

                const fileSize = temporarilyUploadedFile.size / 1024

                if (fileSize > configuration.maxFileSizeInKB) {

                    throw new extendedError(`File size must be lower than ${configuration.maxFileSizeInKB}kb`, 406)
                }
            }  

        }


        /* Image Upload Step-7: Create promises for every single image which we want to upload */
        const uploadPromises = temporarilyUploadedFiles.map(async (temporarilyUploadedFile) => {

            try {

                /* To upload an image, cloudinary needs a temporary path of the image from the server. So, let's first get that*/
                const image_temp_path = temporarilyUploadedFile.tempFilePath;

                const uploaded_image_on_cloudinary = await cloudinary.uploader.upload(

                    // temporary image's path
                    image_temp_path,

                    {
                        /* The 'folder' property:

                            - Cloudinary allows you to organize your images into folders, much like a file system on a computer.
                            - The 'folder' property specifies the name of the destination folder within Cloudinary where the image will be stored.
                        */
                        folder: configuration.cloudinaryFolderName,



                        /* The 'use_filename' property:

                            - When an image is uploaded using the 'express-fileUpload' middleware, it's temporarily saved to a specific directory on the server.

                            - During this process, the middleware assigns a new, temporary name to the image.

                            - However, when transferring this image to Cloudinary, we might not want to use this temporary name.
                            
                            - By setting 'use_filename' to false, we instruct Cloudinary to disregard this temporary name.
                      */
                        use_filename: false,


                        /* The 'public_id' property:

                            - The 'public_id' property determines the name of the image file in Cloudinary.

                            - With the 'public_id' property, we have the ability to manually specify the desired name.

                            - When 'useSourceFileName' is set to true, we want the image in Cloudinary to retain its original name. Therefore, we set the 'public_id' to the original file's name.

                            - If 'useSourceFileName' is false, we don't specify a 'public_id' and depend on 'unique_filename' property to handle the naming.

                        */

                        public_id: useSourceFileName? temporarilyUploadedFile.name : null,

                        /* The 'unique_filename' property:

                            - By default, this property's value is true and if it's true, cloudinary appends a unique random string to the end of the original image file name. This ensures that each uploaded image has a distinct name in Cloudinary.

                            - The 'use_filename' property is set to false, meaning we're not relying on the temporary name given by the server.

                            - The 'useSourceFileName' setting determines whether we want to use the original file's name or let Cloudinary generate a unique name for us.

 
                            - If 'useSourceFileName' is true, we want to keep the original file name intact in Cloudinary. Therefore, we set 'unique_filename' to false to prevent Cloudinary from appending a random string.

                            - When 'useSourceFileName' is false, the responsibility of naming the image in Cloudinary falls solely on the 'unique_filename' property. In this case, Cloudinary will generate a unique name by appending a random string to the original name, ensuring no naming conflicts.
                        */

                        unique_filename: useSourceFileName? false : true,


                        /*The 'overwrite' property:

                            - Sometimes, there might be scenarios where an image with the same name already exists in Cloudinary.

                            - The 'overwrite' property decides how to handle such situations.

                            - If 'useSourceFileName' is true, and an image with the same name already exists, setting 'overwrite' to true will replace the existing image with the new one.

                            - If 'useSourceFileName' is false, since every image will have a unique name due to the 'unique_filename' setting, the 'overwrite' property won't have any effect.
                        */
                        overwrite: useSourceFileName? true: false,
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
                cloudinaryErrorMessage = handleCloudinaryConfigErrors(error)

                // updating the "failedToUploadFilesCount"
                failedToUploadFilesCount = failedToUploadFilesCount + 1;
            }
        })


        /* Image Upload Step-8: Uploading all the images and checking for error */
        await Promise.allSettled(uploadPromises)

        // if any error has occurred while uploading any image
        if (failedToUploadFilesCount > 0) {

            let image = failedToUploadFilesCount === 1 ? 'image' : 'images'

            let error_message = cloudinaryErrorMessage === '' ? `Failed to upload ${failedToUploadFilesCount} ${image}.` : `Failed to upload ${failedToUploadFilesCount} ${image}. ${cloudinaryErrorMessage}`


            throw new extendedError(error_message, 500)
        }
    }


    catch (error) {

        uploadReport.isError = true

        uploadReport.errorInfo = {
            statusCode: error.statusCode,
            message: error.message
        }
    }


    finally {

        // Helper Function to delete files
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


        // Helper function to keep only non-image files 
        const nonImageFilesArray = (files) => {
            return files.filter(file => !file.mimetype.startsWith('image/'));
        }

        // Helper function to collect all uploaded files into a single array
        const allFilesArray = (reqFiles) => {
            const allFiles = [];
            for (const key in reqFiles) {
                const files = reqFiles[key];
                if (Array.isArray(files)) {
                    allFiles.push(...files);
                } else {
                    allFiles.push(files);
                }
            }
            return allFiles;
        }

        // Function to delete files (files which has been uploaded temporarily by "express-fileUpload" package)
        const deleteTemporarilyUploadedFiles = async () => {

            // Check if req.files exists
            if (!req.files) return;

            /* Design Choice:

                - In the 'if' block, we delete all files, so no need to check for non-image files.

                - In the 'else' block, we delete selectively based on a specific field name and then remove any remaining non-image files.
            */

            // Delete all temporarily uploaded files, regardless of their type or the field name used for uploading
            if (deleteAllTempFiles) {
                const allFiles = allFilesArray(req.files);
                await deleteFiles(allFiles);
            }

            // Delete the temporarily uploaded files which were uploaded with the right field name, also delete non image files
            else {
                const specificFiles = req.files[configuration.formDataFieldName];
                await deleteFiles(specificFiles);

                // Delete remaining non-image files
                const allFiles = allFilesArray(req.files);
                const nonImageFiles = nonImageFilesArray(allFiles)
                if (nonImageFiles.length > 0) {
                    await deleteFiles(nonImageFiles)
                }
            }
        }



        await deleteTemporarilyUploadedFiles()

        return uploadReport
    }
}





