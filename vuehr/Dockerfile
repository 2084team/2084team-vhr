FROM nginx
EXPOSE 80
COPY /dist/ /usr/share/nginx/html
COPY /nginx/default.conf /etc/nginx/conf.d/default.conf
ENTRYPOINT nginx -g "daemon off;"