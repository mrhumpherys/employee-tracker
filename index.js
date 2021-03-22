const inquirer = require('inquirer');
const mysql = require('mysql2');
const table = require('console.table');
const promisemysql = require("promise-mysql");
// move to connection.js
const connection = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    // Your MySQL username
    user: 'root',
    // Your MySQL password
    password: '',
    database: 'employee_db'
});

connection.connect(err=> {
    if(err) throw err;
    console.log(

        "Welcome to Employee Tracker!"
    );
    initialQuestion();
});

//write queries in seperate file querieBuilder.js
//prompt asks questions then executes functions in .then according to user response call back first question function. 
//Use switch statement 
const initialQuestion = () => {
    inquirer.prompt([
        {
            type: 'list',
            name: 'first',
            message: 'What would you like to do?',
            choices: ['View Departments', 'View Roles', 'View Employees', 'Add Department', 'Add Role', 'Add Employee', 'Update Employee Role', 'Exit']
        }
    ])
    .then((data) => {
        console.log(data.first);
        switch (data.first) {
            case 'View Departments':
                viewDepartments();
                break;
            case 'View Roles':
                viewRoles();
                break;
            case 'View Employees':
                viewEmployees();
                break;
            case 'Add Department':
                addDepartment();
                break;
            case 'Add Role':
                addRole();
                break;
            case 'Add Employee':
                addEmployee();
                break;
            case 'Update Employee Role':
                updateEmployee();
                break;
            case 'Exit': 
                connection.end();
                break;
            default:
                connection.end();
        }
    });
};

const viewDepartments = () => {
    let sql = 'SELECT * FROM department';
    connection.query(sql, (err, res) => {
        if (err) throw err;
        console.table(res);
        initialQuestion();
    });
};

const viewRoles = () => {
    let sql = 'SELECT main_role.id, main_role.title, main_role.salary, main_role.department_id, department.name FROM main_role INNER JOIN department ON main_role.department_id = department.id';
    connection.query(sql, (err, res) => {
        if (err) throw err;
        console.table(res);
        initialQuestion();
    });
};

const viewEmployees = () => {
    let sql = `SELECT employee.id, employee.first_name, employee.last_name, main_role.title, department.name as department, main_role.salary, CONCAT(e.first_name, " ", e.last_name) as manager
    FROM employee
    INNER JOIN main_role ON (employee.role_id = main_role.id)
    INNER JOIN department ON (main_role.department_id = department.id)
    LEFT JOIN employee AS e ON (employee.manager_id = e.id);`
    connection.query(sql, (err, res) => {
        if (err) throw err;
        console.table(res);
        initialQuestion();
    });
};

const addDepartment = () => {
    inquirer.prompt({
        type: 'input',
        name: 'name',
        message: 'What is the name of the new Department?'
    })
    .then((data) => {
        connection.query(`INSERT INTO department (name)Values ("${data.name}");`, (err, res) => {
            if (err) throw err;
            console.log(`${data.name} was added to Departments`);
            initialQuestion();
        });
    });
};

const addRole = () => {
    inquirer.prompt([{
        type: 'input',
        name: 'title',
        message: 'What is the Title of the new role?'
    },
    {
        type: 'input',
        name: 'salary',
        message: 'What is the salary of the new role?'
    },
    {
        type: 'input',
        name: 'department',
        message: 'What is the department id of the new role?'
    }])
    .then(({title, salary, department}) => {
        connection.query(`INSERT INTO main_role (title, salary, department_id)Values ("${title}","${salary}", "${department}");`, (err, res) => {
            if (err) throw err;
            console.log(`${title} was add to Roles.`);
            initialQuestion();
        });
    });
};

const addEmployee = () => {
    inquirer.prompt([
        {
            type: 'input',
            name: 'first',
            message: 'What is the employees first name?'
        },
        {
            type: 'input',
            name: 'last',
            message: 'What is the employees last name?'
        },
        {
            type: 'input',
            name: 'role',
            message: 'What is the employees Role id?'
        },
        {
            type: 'input',
            name: 'manager',
            message: 'What is the employees manager id?'
        }
    ])
    .then(({ first, last, role, manager}) => {
        connection.query(`INSERT INTO employee (first_name, last_name, role_id, manager_id)Values ("${first}", "${last}", "${role}", "${manager}");`, (err, res) => {
            if (err) throw err;
            console.log(`${first} ${last} was added to Employees.`);
            initialQuestion();
        });
    });
};
const getEmployee = () => {
    let employeeArr = [];
    connection.query('SELECT id, first_name FROM employee', (err, res) => {
        
        res.forEach(res => {
            employeeArr.push(res.first_name)
        })
        return employeeArr;
    });
    return employeeArr;
};
//const updateEmployee = () => {
  //  console.log(getEmployee());
  //  inquirer.prompt([
  //      {
    //        type: 'list',
      //      name: 'employee',
        //    message: 'Which employee would you like to update?',
          //  choices: ['dogs', 'cats']
   //     }
 //   ])
 //   .then((data) => {
 //       console.log(data);
 //   })
//}
function updateEmployee(){

    // create employee and role array
    let employeeArr = [];
    let roleArr = [];

    // Create connection using promise-sql
    promisemysql.createConnection({
        host: 'localhost',
        port: 3306,
        // Your MySQL username
        user: 'root',
        // Your MySQL password
        password: '',
        database: 'employee_db'
    }).then((conn) => {
        return Promise.all([

            // query all roles and employee
            conn.query('SELECT id, title FROM main_role ORDER BY title ASC'), 
            conn.query("SELECT employee.id, concat(employee.first_name, ' ' ,  employee.last_name) AS Employee FROM employee ORDER BY Employee ASC")
        ]);
    }).then(([roles, employees]) => {

        // place all roles in array
        for (i=0; i < roles.length; i++){
            roleArr.push(roles[i].title);
        }

        // place all empoyees in array
        for (i=0; i < employees.length; i++){
            employeeArr.push(employees[i].Employee);
            //console.log(value[i].name);
        }

        return Promise.all([roles, employees]);
    }).then(([roles, employees]) => {

        inquirer.prompt([
            {
                // prompt user to select employee
                name: "employee",
                type: "list",
                message: "Who would you like to edit?",
                choices: employeeArr
            }, {
                // Select role to update employee
                name: "role",
                type: "list",
                message: "What is their new role?",
                choices: roleArr
            },]).then((answer) => {

                let roleID;
                let employeeID;

                /// get ID of role selected
                for (i=0; i < roles.length; i++){
                    if (answer.role == roles[i].title){
                        roleID = roles[i].id;
                    }
                }

                // get ID of employee selected
                for (i=0; i < employees.length; i++){
                    if (answer.employee == employees[i].Employee){
                        employeeID = employees[i].id;
                    }
                }
                
                // update employee with new role
                connection.query(`UPDATE employee SET role_id = ${roleID} WHERE id = ${employeeID}`, (err, res) => {
                    if(err) return err;

                    // confirm update employee
                    console.log(`${answer.employee} ROLE UPDATED TO ${answer.role}.`);

                    // back to main menu
                    
                    initialQuestion();
                });
            });
        
    });
    
}