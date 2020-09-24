package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"io/ioutil"
)

type testJson struct {
	Title string `json:"Title"`
}

type nodeRes struct {
	remoteAddress string
	remotePort string 
	localAddress string
	localPort string
}

func ping(w http.ResponseWriter, r *http.Request){
	res, err := http.Get("http://node:8081")
	if err != nil {
		log.Println("ERR!")
		// fmt.Fprintf(w, "Error")
	}
	stringStatus := strconv.Itoa(res.StatusCode)
	fmt.Fprintf(w, stringStatus)
}

func home(w http.ResponseWriter, r *http.Request){
	testJsonRes := testJson{Title:"Test-Title"}
  json.NewEncoder(w).Encode(testJsonRes)
}

// https://www.soberkoder.com/consume-rest-api-go/
func node(w http.ResponseWriter, req *http.Request) {
	resp, nodeErr := http.Get("http://node:8081")
	if nodeErr != nil {
		log.Println("ERR!")
		// fmt.Fprintf(w, "Error")
	}
	defer resp.Body.Close()
	bodyBytes, _ := ioutil.ReadAll(resp.Body)

	// Convert response body to string
	bodyString := string(bodyBytes)
	fmt.Println("API Response as String:\n" + bodyString)
	fmt.Fprintf(w, bodyString)
}



// Better way to handle json res
// https://www.alexedwards.net/blog/how-to-properly-parse-a-json-request-body
// TODO, JSON body is not showing up, as of now at least the connection works
// TODO: fix JSON body handling
func main() {
	http.HandleFunc("/", node)
	http.HandleFunc("/home", home)
	http.HandleFunc("/ping", ping)
		
		

	fmt.Printf("Starting server at port 8080\n")
	if err := http.ListenAndServe(":8080", nil)
	err != nil {
			log.Fatal(err)
	}
}

// https://blog.logrocket.com/creating-a-web-server-with-golang/