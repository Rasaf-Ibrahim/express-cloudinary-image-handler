// Importing express-fileupload library 
import fileUpload from 'express-fileupload'

// importing types
import { Express } from 'express'



function imageUploadMiddleware(app: Express) {

    /*🔖 As we want to upload the images to cloudinary, there's no point of keeping the images on any folder of  the server. So, we would set the 'useTempFiles' property's value to true so that uploaded images get saved temporarily. */

    app.use(
        fileUpload({ useTempFiles: true })
    )
}


export default imageUploadMiddleware

