let proxyObj = {};
const CompressionPlugin = require("compression-webpack-plugin");

proxyObj['/ws'] = {
    ws: true,
    target: "ws://172.16.75.200:8182"
};
//
proxyObj['/'] = {
    ws: false,
    target: 'http://172.16.75.200:8182',
    changeOrigin: true,
    pathRewrite: {
        '^/': ''
    }
}
module.exports = {
    devServer: {
        host: 'localhost',
        port: 80,
        proxy: proxyObj
    },
    configureWebpack: config => {
        if (process.env.NODE_ENV === 'production') {
            return {
                plugins: [
                    new CompressionPlugin({
                        test: /\.js$|\.html$|\.css/,
                        threshold: 1024,
                        deleteOriginalAssets: false
                    })
                ]
            }
        }
    }
}