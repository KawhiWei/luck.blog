FROM nginx
COPY . ./usr/share/nginx/html
RUN ls
COPY ./nginx.conf /etc/nginx/nginx.conf 
EXPOSE 80