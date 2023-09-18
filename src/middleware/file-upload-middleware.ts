// Importing express-fileupload library 
import fileUpload from 'express-fileupload'

// importing types
import { Express } from 'express'



function imageUploadMiddleware(app: Express) {

    /*🔖 As we want to upload the images to cloudinary, there's no point of keeping the images on any folder of  the server. So, we would set the 'useTempFiles' property's value to true so that uploaded images get saved temporarily. */

    app.use(
        fileUpload({ useTempFiles: true })
    )


    
    /*  ⚠️ I tried the following code to have a custom name for the folder in which I am saving the temporary uploaded files but I couldn't see the files */

    /* 
        const __filename = fileURLToPath(import.meta.url)
        const __dirname = path.dirname(__filename)
        const tempDir = path.join(__dirname, 'temporary-upload')

        app.use(
            fileUpload({   
                useTempFiles : true,
                tempFileDir : tempDir 
            })
        )
    */
}


export default imageUploadMiddleware

