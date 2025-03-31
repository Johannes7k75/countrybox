FROM golang:1.23.5 AS builder

WORKDIR /usr/src/app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 go build -v -o /usr/src/app/countryBox ./cmd/api/main.go

FROM alpine:3.21
WORKDIR /app

COPY --from=builder /usr/src/app/countryBox /app/countryBox
RUN chmod +x /app/countryBox

CMD ["./countryBox"]