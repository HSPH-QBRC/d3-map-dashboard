// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';

// @Injectable({
//   providedIn: 'root'
// })
// export class CsvDataService {

//   constructor(private http: HttpClient) {}

//   // Public method to load CSV data
//   async loadCSVData(csvFile): Promise<any[]> {
//     try {
//       const csvText = await this.fetchCSV(csvFile);
//       return this.parseCSV(csvText);
//     } catch (error) {
//       console.error('Error loading CSV data:', error);
//       throw error; // Rethrow the error to be handled in the calling component
//     }
//   }

//   // Private method to fetch CSV file from assets folder using HttpClient
//   private fetchCSV(csvFile): Promise<string> {
//     return new Promise((resolve, reject) => {
//       this.http.get(csvFile, { responseType: 'text' })
//         .subscribe({
//           next: (data: string) => resolve(data),
//           error: (err) => reject(err),
//         });
//     });
//   }

//   // Private method to parse CSV string into an array of objects
//   private parseCSV(csvText: string): any[] {
//     const rows = csvText.split('\n');  // Split the CSV into rows
//     const headers = rows[0].split(',');  // First row contains the headers (keys)

//     return rows.slice(1).map(row => {
//       const values = row.split(',');  // Split each row into values
//       let obj: any = {};
//       headers.forEach((header, index) => {
//         const value = values[index]?.trim();  // Access value and trim any whitespace
//         if (value !== undefined && value !== null) {
//           // Remove extra quotes if they exist
//           obj[header.trim()] = value.startsWith('"') && value.endsWith('"')
//             ? value.slice(1, -1)  // Remove first and last quote characters
//             : value;
//         }
//       });
//       return obj;
//     });
//   }

// }

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import * as Papa from 'papaparse';

export interface CsvRow {
  [key: string]: string;
}

@Injectable({
  providedIn: 'root',
})
export class CsvDataService {
  constructor(private http: HttpClient) {}

  async loadCSVData(csvFile: string): Promise<CsvRow[]> {
    try {
      const csvText = await this.fetchCSV(csvFile);
      return this.parseCSV(csvText);
    } catch (error) {
      console.error('Error loading CSV data:', error);
      throw error;
    }
  }

  private async fetchCSV(csvFile: string): Promise<string> {
    return lastValueFrom(this.http.get(csvFile, { responseType: 'text' }));
  }

  private parseCSV(csvText: string): CsvRow[] {
    const results = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    return results.data as CsvRow[]; // Cast the result to CsvRow[]
  }
}

