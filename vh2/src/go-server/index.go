package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	// "io/ioutil"
)

type Foo struct {
	Bar string
}

// Better way to handle json res
// https://www.alexedwards.net/blog/how-to-properly-parse-a-json-request-body
// TODO, JSON body is not showing up, as of now at least the connection works
// TODO: fix JSON body handling
func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request){
		res, err := http.Get("http://node:8081")
		if err != nil {
			log.Println("ERR1!")
			// fmt.Fprintf(w, "Error")
		}
		foo1 := new(Foo) // or &Foo{}
		err2 := json.NewDecoder(res.Body).Decode(foo1)
    if err2 != nil {
			log.Println("ERR2!")
			// fmt.Fprintf(w, "Error2")
		}
		log.Println(foo1.Bar)
		log.Println("HERE")
		log.Println(string(foo1.Bar))
		// stringBody := string(foo1.Bar)
		stringStatus := strconv.Itoa(res.StatusCode)
		fmt.Fprintf(w, stringStatus)
	})

	fmt.Printf("Starting server at port 8080\n")
	if err := http.ListenAndServe(":8080", nil); err != nil {
			log.Fatal(err)
	}
}

// https://blog.logrocket.com/creating-a-web-server-with-golang/