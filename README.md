[beats](https://beats.gatunes.com/)
[![Build Status](https://travis-ci.org/danielesteban/beats.svg?branch=master)](https://travis-ci.org/danielesteban/beats)
==

> A virtual collaborative song

 * [Live demo](https://beats.gatunes.com/)
 * [Docker image](https://hub.docker.com/r/danigatunes/beats)

#### docker-compose

```yaml
version: '3'
services:
  server:
    image: danigatunes/beats:latest
    ports:
     - "80:8080"
```
