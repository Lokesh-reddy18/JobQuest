import { v2 as cloudinary } from 'cloudinary'
import dotenv from 'dotenv'

dotenv.config()

// Configure Cloudinary
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET, 
})

// Function to upload file to Cloudinary
export const uploadToCloudinary = async (filePath, folder) => {
    try {
        console.log('Starting Cloudinary upload...')
        console.log('File path:', filePath)
        console.log('Folder:', folder)
        
        const result = await cloudinary.uploader.upload(filePath, {
            folder: folder,
            resource_type: 'raw',
            format: 'pdf'
        })
        
        console.log('Cloudinary upload successful:', result)
        return result
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error)
        throw new Error('Failed to upload file to Cloudinary: ' + error.message)
    }
}

export default cloudinary