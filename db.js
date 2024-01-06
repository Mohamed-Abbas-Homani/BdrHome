import * as SQLite from 'expo-sqlite';
export default db = SQLite.openDatabase('database.db');
export const currentDate = new Date().toISOString().split('T')[0];

export const initDataBase = () => {
  db.transaction((tx) => {
    tx.executeSql('CREATE TABLE IF NOT EXISTS sells (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, count INTEGER, price REAL, date TEXT);', []);
    tx.executeSql('CREATE TABLE IF NOT EXISTS needs (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, count INTEGER, date TEXT);', []);
    tx.executeSql('CREATE TABLE IF NOT EXISTS debts (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, debt REAL, date TEXT);', []);
    tx.executeSql('CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, body TEXT, date TEXT);', []);
    tx.executeSql('CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, barcode TEXT, count INTEGER, price REAL, categorie TEXT, date TEXT);', []);
  });
  };
  
export const executeSqlAsync = async (sql, params) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
    tx.executeSql(
      sql,
      params,
      (_, result) => resolve(result),
      (_, error) => reject(error)
    );
    });
  });
};
  
export const insertSell = async (name, count, price, date) => {
  await executeSqlAsync('INSERT INTO sells (name, count, price, date) VALUES (?, ?, ?, ?);', [name, count, price, date]);
};
  
export const insertNeed = async (id, name, count, date, editMode = false) => {
  const sql = editMode
    ? 'UPDATE needs SET name = ?, count = ? WHERE id = ?;'
    : 'INSERT INTO needs (name, count, date) VALUES (?, ?, ?);';
  
  await executeSqlAsync(sql, [name, parseInt(count), editMode? id: date]);

  };
  
export const insertDebt = async (id, name, debt, date, editMode = false) => {
  const sql = editMode
    ? 'UPDATE debts SET name = ?, debt = ? WHERE id = ?;'
    : 'INSERT INTO debts (name, debt, date) VALUES (?, ?, ?);';
  
  await executeSqlAsync(sql, [name, parseInt(debt), editMode? id: date]);
  };
  
export const insertNotes = async (id, body, date, editMode = false) => {
  const sql = editMode
    ? 'UPDATE notes SET body = ? WHERE id = ?;'
    : 'INSERT INTO notes (body, date) VALUES (?, ?);';
  
  await executeSqlAsync(sql, [body, editMode? id: date]);
  };
  
export const insertProduct = async (id, name, barcode, categorie, count, price,  date, editMode = false) => {
  const sql = editMode
    ? 'UPDATE products SET name = ?, barcode = ?, count = ?, price = ?, categorie = ? WHERE id = ?;'
    : 'INSERT INTO products (name, barcode, count, price, categorie,  date) VALUES (?, ?, ?, ?, ?, ?);';
  
  await executeSqlAsync(sql, [name, barcode, parseInt(count), parseFloat(price), categorie, editMode? id: date]);
  };
  
export const deleteRecord = async (id, table) => {
  await executeSqlAsync(`DELETE FROM ${table} WHERE id = ?;`, [id]);
  };

  export const getPriceByName = async (name, neededCount) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
    tx.executeSql(
      `SELECT price, count FROM products WHERE name = ?;`,
      [name],
      (_, { rows }) => {
      if (rows.length > 0) {
        const { price, count } = rows.item(0);
        if (count - neededCount < 0) {
        resolve([`${count} left`,false]);
        } else {
        resolve([price, true]);
        }
      } else {
        // Product not found
        resolve(["not found", false]);
      }
      },
      (_, error) => {
      console.error("Error executing SQL query:", error);
      reject(error);
      }
    );
    });
  });
  };
  
export const updateProductCount = async (productName, newCount) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
    // Fetch the current count
    tx.executeSql(
      'SELECT count FROM products WHERE name = ?;',
      [productName],
      (_, { rows }) => {
      if (rows.length > 0) {
        const currentCount = rows.item(0).count;
  
        // Calculate the updated count
        const updatedCount = currentCount - newCount;
  
        // Update the count in the database
        tx.executeSql(
        'UPDATE products SET count = ? WHERE name = ?;',
        [updatedCount, productName],
        (_, { rowsAffected }) => {
          if (rowsAffected > 0) {
          // Update successful
          resolve(`Count for ${productName} updated to ${updatedCount}`);
          } else {
          // Product not found
          resolve(`Product with name ${productName} not found`);
          }
        },
        (_, error) => {
          console.error("Error executing SQL query:", error);
          reject(error);
        }
        );
      } else {
        // Product not found
        resolve(`Product with name ${productName} not found`);
      }
      },
      (_, error) => {
      console.error("Error executing SQL query:", error);
      reject(error);
      }
    );
    });
  });
  };

export  const updateProductCount2 = async (productId, newCount) => {
  const sql = 'UPDATE products SET count = ? WHERE id = ?;';
  const result = await executeSqlAsync(sql, [newCount, productId]);
  };

export const generateInsertStatements = async (forAll=true) => {
  const tables = forAll? ['sells', 'needs', 'debts', 'notes','products']: ['products'];

  let insertStatements = '';

  const executeQuery = async (table) => {
    return new Promise((resolve) => {
      db.transaction((tx) => {
        tx.executeSql(`SELECT * FROM ${table};`, [], (_, { rows }) => {
          const rowsCount = rows.length;
          if (rowsCount > 0) {
            for (let i = 0; i < rowsCount; i++) {
              const row = rows.item(i);
              const columns = Object.keys(row).filter((column) => column !== 'id');
              const values = columns.map((column) => {
                const value = row[column];
                return typeof value === 'string' ? `'${value}'` : value;
              });
              insertStatements += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
              
            }
          }
          resolve();
        });
      });
    });
  };
  
  await Promise.all(tables.map((table) => executeQuery(table)));
  return forAll? ('DROP TABLE IF EXISTS sells;\n' +
  'DROP TABLE IF EXISTS products;\n' +
  'DROP TABLE IF EXISTS needs;\n' +
  'DROP TABLE IF EXISTS debts;\n' +
  'DROP TABLE IF EXISTS notes;\n' +
  'CREATE TABLE IF NOT EXISTS sells (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, count INTEGER, price REAL, date TEXT);\n' +
  'CREATE TABLE IF NOT EXISTS needs (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, count INTEGER, date TEXT);\n' +
  'CREATE TABLE IF NOT EXISTS debts (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, debt REAL, date TEXT);\n' +
  'CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, body TEXT, date TEXT);\n' +
  'CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, barcode TEXT, count INTEGER, price REAL, categorie TEXT, date TEXT);\n' +
   insertStatements)
   :
   ('DROP TABLE IF EXISTS products;\n' +
  'CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, barcode TEXT, count INTEGER, price REAL, categorie TEXT, date TEXT);\n' +
   insertStatements)
};


export const executeInsertStatements = async (sqlStatements) => {
  console.log(sqlStatements)
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        // Split the statements by semicolon and execute each one
        const statements = sqlStatements.split(';').filter((statement) => statement.trim() !== '');

        statements.forEach((statement, i) => {
              tx.executeSql(statement, [], (_, result) => {
              // You can handle the result if needed
            });
          // setTimeout(() => {
          //   tx.executeSql(statement, [], (_, result) => {
          //     // You can handle the result if needed
          //   });
          //   console.log("hi"+ i)
          // }, i*200);
        });
      },
      (error) => {
        reject(error);
      },
      () => {
        resolve();
      }
    );
  });
};

export const getNameByBarcode = async (barcode) => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT name FROM products WHERE barcode = ?',
        [barcode],
        (_, { rows }) => {
          const result = rows.item(0);
          if (result) {
            resolve(result.name);
          } else {
            resolve("not found!");
          }
        },
        (_, error) => {
          reject(error);
        }
      );
    });
  });
};

export const getProductSize = () => {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT COUNT(*) as size FROM products',
        [],
        (_, result) => {
          const size = result.rows.item(0).size;
          resolve(size);
        },
        (_, error) => {
          reject(error);
        }
      );
    });
  });
};