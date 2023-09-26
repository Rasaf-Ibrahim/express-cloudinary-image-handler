import { dependencies, ConfigOptions } from 'express-cloudinary-image-handler-dependencies'

const { v2: cloudinary } = dependencies.cloudinary

export { cloudinary }

export type { ConfigOptions }