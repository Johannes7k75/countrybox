package utils

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

func WriteJSONResponse(w http.ResponseWriter, data interface{}, statusCode int) {
	w.Header().Set("Content-Type", "application/json")

	jsonResp, err := json.Marshal(data)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error marshalling JSON response: %v", err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(statusCode)
	_, err = w.Write(jsonResp)
	if err != nil {
		log.Printf("Error writing response: %v", err)
	}
}
