import React from 'react'
import { DocsThemeConfig } from 'nextra-theme-docs'

const config: DocsThemeConfig = {


    // theme
    nextThemes: {
        defaultTheme: 'dark',
    },



    // theme color
    primaryHue: 200,

    //  SEO
    useNextSeoProps() {
        return {
            titleTemplate: '%s – express-cloudinary-image-handler'
        }
    },

    // banner
    // banner: {
    //     dismissible: false,
    //     key: 'under_construction', // for localStorage
    //     text: (
    //       <p className='body2'>
    //         🚧 This site is under construction.
    //       </p>
    //     )
    // },  

    
    // logo
    logo: <span className='logo_text'>express-cloudinary-image-handler</span>,


    // repo base link
    project: {
        link: 'https://github.com/Rasaf-Ibrahim/express-cloudinary-image-handler',
    },

    // base path of the documentation site
    docsRepositoryBase: 'https://github.com/Rasaf-Ibrahim/express-cloudinary-image-handler/blob/main/documentation',



    //sidebar
    toc: {
        title: <span className='body2'>On This Page</span>,
    },

    editLink: {
        text: 'Edit this page on GitHub →'
    },
    feedback: {
        content: 'Question? Give us feedback →',
        labels: 'feedback'
    },


    // footer
    footer: {
        text: (
            <p style={{ fontSize: '14px' }}>
                © {new Date().getFullYear()} express-cloudinary-image-handler
            </p>
        )
    },




}

export default config
