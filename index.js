const express = require('express');
const mysql = require('mysql2');
const inquirer = require('inquirer');
const PORT = process.env.PORT || 3001;
const app = express();
const cTable = require('console.table');
const { response } = require('express');

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const db = mysql.createConnection(
    {
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'work_db'
    },
    console.log(`Connected to the work database.`)
);

// init();

db.connect(function (err) {
    if (err) throw err
    init();
})

function init() {
    inquirer
        .prompt([
            {
                name: "pickList",
                message: "What would you like to do?",
                type: 'list',
                choices: ['View All Employees', 'Add Employee', 'Update Employee Role', 'View All Roles', 'Add Role', 'View All Departments', 'Add Department', 'Quit']
            },
        ])
        .then(function (response) {
            switch (response.pickList) {
                case 'View All Employees':
                    viewAllEmployees()
                    break;
                case 'Add Employee':
                    addEmployee()
                    break;
                case 'Update Employee Role':
                    updateRole()
                    break;
                case 'View All Roles':
                    viewAllRoles()
                    break;
                case 'Add Role':
                    addRole()
                    break;
                case 'View All Departments':

                    break;
                case 'Add Department':

                    break;
                case "Quit":

                    db.end

            }
        });
}

function viewAllEmployees() {
    const viewEmployees = 'SELECT employee.id, employee.first_name, employee.last_name, roles.title, department.names AS department, roles.salary, CONCAT (manager.first_name, " ", manager.last_name) AS manager FROM employee LEFT JOIN roles ON employee.role_id = roles.id LEFT JOIN department ON roles.department_id = department.id LEFT JOIN employee manager ON employee.manager_id = manager.id'
    db.query(viewEmployees, (err, res) => {
        if (err)
            throw err
        console.table(res)
        init()
    })
}

function addEmployee() {
    inquirer
        .prompt([
            {
                name: 'firstName',
                type: 'input',
                message: "What is the employee's first name?",
            },
            {
                name: 'lastName',
                type: 'input',
                message: "What is the employee's last name?",
            }
        ])
        .then(response => {
            let roleList = [response.firstName, response.lastName]
            db.query("SELECT roles.id, roles.title FROM roles", (err, data) => {
                if (err)
                    throw error
                const roles = data.map(({ id, title }) => ({ name: title, value: id }));
                inquirer
                    .prompt(
                        {
                            name: 'role',
                            type: 'list',
                            message: "What is the employee's role?",
                            choices: roles
                        }
                    )
                    .then(roleRes => {
                        roleList.push(roleRes.role)
                        db.query("SELECT * FROM employee", (err, data) => {
                            if (err)
                                throw error
                            const managers = data.map(({ id, first_name, last_name }) => ({ name: first_name + " " + last_name, value: id }))
                            inquirer
                                .prompt(
                                    {
                                        name: 'manager',
                                        type: 'list',
                                        message: "Who is the employee's manager?",
                                        choices: managers
                                    }
                                )
                                .then(managerRes => {
                                    roleList.push(managerRes.manager)
                                    db.query('INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?,?,?,?)', roleList), (err,res) => {
                                        if (err)
                                            throw error
                                    }
                                    init()
                                })
                        })
                    })
            })
        })
}

function updateRole() {
    let roleArr = [];
    let managerArr = [];
    db.query('SELECT employee.id, employee.first_name, employee.last_name FROM employee', (err, data) => {
        if (err)
            throw error
        data.forEach((employee) => {
            managerArr.push(`${employee.first_name} ${employee.last_name}`)
        });
        console.log(managerArr)
        db.query('SELECT roles.id, roles.title FROM roles', (err, data) => {
            if (err)
                throw error
            data.forEach((roles) => {
                roleArr.push(roles.title)
            });
            console.log(roleArr)
            inquirer
                .prompt([
                    {
                        name: 'empName',
                        type: 'list',
                        message: "Which employee's role do you want to update?",
                        choices: managerArr
                    },
                    {
                        name: 'updateEmpRole',
                        type: 'list',
                        message: "Which role do you want to assign to selected employee?",
                        choices: roleArr
                    }
                ])
                .then(response => {
                    let newTitleId
                    let employeeId
                    data.forEach((employee) => {
                        if (response.empName === `${employee.first_name} ${employee.last_name}`) {
                            employeeId = employee.id
                        }
                    })
                    data.forEach((roles) => {
                        if (response.updateEmpRole === roles.title) {
                            newTitleId = roles.id
                        }
                    });
                    db.query(`UPDATE employee SET employee.role_id = ? WHERE employee.id = ?`, [newTitleId, employeeId]), (err) => {
                        if (err)
                            return err
                    }
                    init()
                })
        })
    })
}

function viewAllRoles() {
    db.query("SELECT * FROM roles", (err, data) => {
        if (err)
            throw error
        console.table(data)
        init()
    })
}

// function addRole() {
//     inquirer
//         .prompt([
//             {
//                 name: 'roleName',
//                 type: 'input',
//                 message: 'What is the name of the role?'
//             },
//             {
//                 name: 'roleSalary',
//                 type: 'input',
//                 message: 'What is the salary of the role?'
//             }
//         ])
//         .then(response => {
//             let addRoleList = [response.roleName, response.roleSalary]
//             const roles = data.map(({ id, title }) => ({ name: title, value: id }));
//                 inquirer
//                     .prompt(
//                         {
//                             name: 'role',
//                             type: 'list',
//                             message: "What is the employee's role?",
//                             choices: roles
//                         }
//                     )
//         })
// }
