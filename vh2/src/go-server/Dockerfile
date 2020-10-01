# Multi-stage minimal fileprint GO image

# Get alpine image and store it inside a variable 'builder'
FROM golang:alpine AS builder
# Install git.
# Git is required for fetching the dependencies.
RUN apk update && apk add --no-cache git
# RUN apk add --no-cache bash
# Create appuser.
ENV USER=appuser
ENV UID=1337

# --disabled-password prevents prompt for a password
# --gecos "" circumvents the prompt for "Full Name" etc. on Debian-based systems
# --home "$(pwd)" sets the user's home to the WORKDIR.
# --no-create-home prevents cruft getting copied into the directory from /etc/skel
RUN adduser \    
    --disabled-password \
    --gecos "" \    
    --home "/nonexistent" \    
    --shell "/sbin/nologin" \    
    --no-create-home \    
    --uid "${UID}" \    
    "${USER}"

# This only affects the containers path
WORKDIR $GOPATH/src/mypackage/myapp/
# https://docs.docker.com/engine/reference/builder/#copy
# We are copying everything from current file to the WORKDIR path of the container
COPY . .
# Fetch dependencies.
# Using go get.
RUN go get -d -v
# Using go mod.
# RUN go mod download
# RUN go mod verify
# Build the binary.
RUN GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o /go/bin/hello

############################
# STEP 2 build a small image
############################

# if you want an even smaller iamge (5MB instead of 10MB) change this to FROM scratch
# however if you do this you cannot run interactive shell
FROM  alpine:latest
# Import the user and group files from the builder.
COPY --from=builder /etc/passwd /etc/passwd
COPY --from=builder /etc/group /etc/group
# Copy our static executable.
COPY --from=builder /go/bin/hello /go/bin/hello
# Use an unprivileged user.
USER appuser:appuser
COPY --chown=appuser:appuser . .
# Run the hello binary.
# https://docs.docker.com/engine/reference/builder/#entrypoint
# ENTRYPOINT ["/go/bin/hello"]

# Run on start
CMD ["/go/bin/hello"]