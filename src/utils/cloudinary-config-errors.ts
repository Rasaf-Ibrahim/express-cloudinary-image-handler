export default function handleCloudinaryConfigErrors(error: any): string {

    /* 🔖 
      
        🥔 What does this function do?

        - This function is for checking cloudinary configuration errors

        - If there is no cloudinary configuration errors, this function will return empty string 



        🥔 How have I designed this function?
        
        - I have checked the error messages by doing console.log(error).

        - I got 6 type of errors based on cloudinary configuration.

        - From this function, I am returning a better error message.

    */



    // If there is no cloudinary configuration errors, this function will return empty string 
    let defaultMessage = ''


    //  error can be string when any of the config property is undefined
    if (typeof error === 'string') {

        if (error === 'Must supply cloud_name') {
            return 'Cloudinary configuration error: You must provide cloud name.'
        }

        else if (error === 'Must supply api_key') {
            return 'Cloudinary configuration error: You must provide API key.'
        }

        else if (error === 'Must supply api_secret') {
            return 'Cloudinary configuration error: You must provide API secret.'
        }

        else {
            return defaultMessage
        }
    }


    //  error can an object when any of the config property's value is invalid 
    else if (error && error.message) {

        if (error.message.startsWith('Invalid cloud_name')) {
            return 'Cloudinary configuration error: Invalid cloud name provided.'
        }

        else if (error.message.startsWith('Invalid api_key')) {
            return 'Cloudinary configuration error: Invalid API key provided.'
        }

        else if (error.message.startsWith('Invalid Signature')) {
            return 'Cloudinary configuration error: Invalid API secret.'
        }

        else {
            return defaultMessage
        }
    }

    
    else {
        return defaultMessage
    }
}
