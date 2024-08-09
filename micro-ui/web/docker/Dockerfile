# FROM egovio/alpine-node-builder-14:yarn AS build
FROM ghcr.io/egovernments/alpine-node-builder-14:yarn AS build
RUN apk update && apk upgrade
RUN apk add --no-cache git>2.30.0

RUN yarn add @egovernments/digit-ui-libraries@1.8.1
RUN yarn add @egovernments/digit-ui-module-core@1.8.1
RUN yarn add @egovernments/digit-ui-module-pgr@1.7.0-beta.2
RUN yarn add @egovernments/digit-ui-module-hrms@1.8.0
RUN yarn add @egovernments/digit-ui-module-utilities
RUN yarn add @egovernments/digit-ui-react-components@1.8.0
RUN yarn add @egovernments/digit-ui-module-dss@1.8.0
RUN yarn add @egovernments/digit-ui-module-engagement
RUN yarn add @egovernments/digit-ui-module-common@1.8.0
RUN yarn add @egovernments/digit-ui-module-workbench@1.0.1

ARG WORK_DIR
WORKDIR /app
ENV NODE_OPTIONS "--max-old-space-size=8168"

COPY ${WORK_DIR} .
RUN ls -lah

#RUN node web/envs.js
RUN cd web/ \
    &&  ./install-deps.sh \
    && yarn install \
    && yarn build 

FROM nginx:mainline-alpine
#FROM ghcr.io/egovernments/nginx:mainline-alpine
ENV WORK_DIR=/var/web/digit-ui

RUN mkdir -p ${WORK_DIR}

COPY --from=build /app/web/build ${WORK_DIR}/
COPY --from=build /app/web/docker/nginx.conf /etc/nginx/conf.d/default.conf
