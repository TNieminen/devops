package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

type GoRes struct{
	RemoteAddress string `json:"remoteAddress"`
	LocalAddress string `json:"localAddress"`
}


func home(w http.ResponseWriter, r *http.Request){
	response := &GoRes{RemoteAddress: r.RemoteAddr , LocalAddress: r.Host}
	json.NewEncoder(w).Encode(response)
	}

func main() {
	http.HandleFunc("/", home)
	fmt.Printf("Starting server at port 8080\n")
	if err := http.ListenAndServe(":8080", nil)
	err != nil {
			log.Fatal(err)
	}
}