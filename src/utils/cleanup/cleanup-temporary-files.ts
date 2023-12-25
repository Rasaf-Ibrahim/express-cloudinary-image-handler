/*__________________________________________

 ✅ import
____________________________________________*/
import fs from 'fs'
import util from 'util'
import { type_of_request_with_files } from '../../types/types.js'


/*__________________________________________

 ✅ types
____________________________________________*/
type PayloadType = {
    req: type_of_request_with_files,
}


/*__________________________________________

 ✅ Util
____________________________________________*/
export default async function cleanupTemporaryFiles(payload:PayloadType) {

    // payload
    const { req } = payload

    // cleanup report
    let cleanupReport = {
        isError: false,
        errorInfo: {
            statusCode: 500,
            message: ''
        }
    }
    

    // Helper Function to delete files
    const deleteFiles = async (filesToDelete) => {

        // failed to delete
        let failedToDeleteFilesPath: string[] = []


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
            cleanupReport.isError = true
            cleanupReport.errorInfo.statusCode = 500

            // Modify the original message to include failure details
            cleanupReport.errorInfo.message = `${cleanupReport.errorInfo.message} Failed to delete temporarily uploaded files, their paths: ${failedToDeleteFilesPath.join(', ')}.`
        }   
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
        return allFiles
    }

    // delete all files
    const allFiles = allFilesArray(req.files)
    await deleteFiles(allFiles)


    // return cleanupReport
    return cleanupReport
    
}