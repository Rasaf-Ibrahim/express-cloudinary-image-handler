/*__________________________________________

 ✅ import
____________________________________________*/

// library
import { cloudinary } from '../../dependencies/cloudinary.js'
import handleCloudinaryConfigErrors from '../cloudinary-config-errors.js';


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
    let deleteReport: DeleteReportType = {
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
    let cloudinaryErrorMessage = ''


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
            cloudinaryErrorMessage = handleCloudinaryConfigErrors(error)

            errorPublicIds.push(public_id)
        }
    })


    // Execute all promises and wait for them to settle
    await Promise.allSettled(imageDeletionPromises)


    // Initialize an empty string to generate error message
    let error_message: string = "";


    // if there is any cloudinary configuration error
    if (cloudinaryErrorMessage !== '') {
        error_message = cloudinaryErrorMessage
    }

    // if there isn't any cloudinary configuration error, but other errors
    else {

        // Accumulate error message using template literals
        if (successPublicIds.length > 0) {

            const image = successPublicIds.length === 1 ? 'image' : 'images'

            const public_id = successPublicIds.length === 1 ? 'public_id' : 'public_ids'

            error_message = `Successfully deleted ${image} with ${public_id}: ${successPublicIds.join(', ')}. `;
        }


        if (notFoundPublicIds.length > 0) {

            const image = notFoundPublicIds.length === 1 ? 'image' : 'images'

            const public_id = notFoundPublicIds.length === 1 ? 'public_id' : 'public_ids'

            error_message = `${error_message}Couldn't find ${image} in cloudinary with ${public_id}: ${notFoundPublicIds.join(', ')}. `

            deleteReport.errorInfo.statusCode = 404;
        }


        if (errorPublicIds.length > 0) {

            const image = errorPublicIds.length === 1 ? 'image' : 'images'

            const public_id = errorPublicIds.length === 1 ? 'public_id' : 'public_ids'


            error_message = `${error_message}Because of server error, couldn't delete ${image} with ${public_id}: ${errorPublicIds.join(', ')}. `

            deleteReport.errorInfo.statusCode = 500
        }
    }


    // If there are any errors, update the deleteReport object
    if (cloudinaryErrorMessage !== '' || notFoundPublicIds.length > 0 || errorPublicIds.length > 0) {
        
        deleteReport.isError = true
        deleteReport.errorInfo.message = error_message
    }



    // Return the deleteReport 
    return deleteReport
}


