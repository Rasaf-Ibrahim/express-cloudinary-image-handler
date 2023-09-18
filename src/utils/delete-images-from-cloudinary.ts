/*__________________________________________

 ✅ import
____________________________________________*/

// library
import { v2 as cloudinary } from 'cloudinary'


/*__________________________________________

 ✅ types
____________________________________________*/

type PayloadType = {
    publicIds: string | string[]
}


type DeleteReportType = {
    isError: boolean,
    errorInfo: {
        statusCode: number | null,
        message: string | null
    }
}



/*__________________________________________

 ✅ util
____________________________________________*/


export default async function deleteImagesFromCloudinary(payload: PayloadType): Promise<DeleteReportType> {

    // payload
    let { publicIds } = payload


    // When deleting a single image, either a string or a 1-element array can be passed as 'publicIds'. If a string is passed, convert it into an array
    if (!Array.isArray(publicIds)) {
        publicIds = [publicIds]
    }

    // Initializing the delete report which we will return from this function
    let deleteReport:DeleteReportType = {
        isError: false,
        errorInfo: {
            statusCode: null,
            message: ""
        }
    }


    // Initializing arrays which will collect info for generating a good error message 
    let notFoundPublicIds: string[] = []
    let errorPublicIds: string[] = []
    let successPublicIds: string[] = []


    // Create an array of promises for deleting images
    const imageDeletionPromises = publicIds.map(async (public_id) => {

        try {
            const response = await cloudinary.uploader.destroy(public_id)
            
            if (response.result === 'not found') {
                notFoundPublicIds.push(public_id)
            }
            
            else {
                successPublicIds.push(public_id)
            }
        }

        catch (error) {
            errorPublicIds.push(public_id)
        }
    })


    // Execute all promises and wait for them to settle
    await Promise.allSettled(imageDeletionPromises)


    // Initialize an empty string to generate error message
    let error_message: string = "";


    // Accumulate error message using template literals
    if (successPublicIds.length > 0) {
        error_message = `Successfully deleted images with public_ids: ${successPublicIds.join(', ')}. `;
    }

    if (notFoundPublicIds.length > 0) {
        error_message = `${error_message}Couldn't find images in cloudinary with public_ids: ${notFoundPublicIds.join(', ')}. `

        deleteReport.errorInfo.statusCode = 404;
    }

    if (errorPublicIds.length > 0) {
        error_message = `${error_message}Because of server error, couldn't delete images with public_ids: ${errorPublicIds.join(', ')}. `

        deleteReport.errorInfo.statusCode = 500;
    }


    // If there were any errors, update the deleteReport object
    if (notFoundPublicIds.length > 0 || errorPublicIds.length > 0) {

        deleteReport.isError = true
        deleteReport.errorInfo.message = error_message
    }

    // Return the deleteReport 
    return deleteReport
}


