// cloudinary
import { cloudinary, ConfigOptions } from '../dependencies/cloudinary.js'

type cloudinaryConfigType = {
    cloudName: string
    apiKey: string
    apiSecret: string
}

const cloudinaryConfig = (payload: cloudinaryConfigType): ConfigOptions | undefined => {


    const {
        cloudName,
        apiKey,
        apiSecret
    } = payload


    const configuration = cloudinary.config({

        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret
    })


    return configuration
}

export default cloudinaryConfig


