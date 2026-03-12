FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=1 go build -o howiconic .

FROM alpine:latest
RUN apk add --no-cache libc6-compat sqlite-libs
WORKDIR /app
COPY --from=builder /app/howiconic .
COPY --from=builder /app/static ./static
COPY --from=builder /app/templates ./templates
EXPOSE 3800
CMD ["./howiconic"]
