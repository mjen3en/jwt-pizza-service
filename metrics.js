const config = require("./src/config");
const os = require('os');
const fetch = require("node-fetch");

class Metrics {
  constructor() {
    this.getRequests = 0;
    this.postRequests = 0;
    this.putRequests = 0;
    this.deleteRequests = 0;
    this.pizzaSuccess = 0;
    this.pizzaFailure = 0;
    this.pizzaMoney = 0;
    this.authSuccess = 0;
    this.authFailure = 0;
    this.activeUsers = 0;

    const timer = setInterval(() => {
      this.sendRequestMetrics();
      this.sendAuthMetrics();
      this.sendPizzaMetrics();
      this.sendOSmetrics();
      this.sendActiveUsersMetrics();
    }, 10000);

    timer.unref();
  }

  track(req, res, next) {
    const method = req.method;
    const path = req.path;
    switch (method) {
      case "GET":
        this.incrementGetRequests();
        break;
      case "POST":
        this.incrementPostRequests();
        break;
      case "PUT":
        this.incrementPutRequests();
        break;
      case "DELETE":
        this.incrementDeleteRequests();
        break;
      default:
        break;
    }

    const start = process.hrtime();

    res.on('finish', () => {
      const statusCode = res.statusCode;
      const [seconds, nanoseconds] = process.hrtime(start);
      const elapsedTime = seconds * 1000 + nanoseconds / 1e6; // Convert to milliseconds
      this.sendMetricToGrafana("request", method, "response_time_ms", elapsedTime);
      if (path === "/api/order" && method === "POST") {
        if (statusCode >= 200 && statusCode < 300) {
          this.incrementPizzaSuccess();
          this.sendMetricToGrafana("pizza", "POST", "response_time_ms", elapsedTime);
          const money = req.body.items.reduce((total, item) => total + item.price, 0);
          this.incrementPizzaMoney(money);
        } else {
          this.incrementPizzaFailure();
        }
      }
      

      if (path === "/api/auth" && method === "PUT") {
        if (statusCode >= 200 && statusCode < 300) {
          this.incrementAuthSuccess();
        } else {
          this.incrementAuthFailure();
        }
      }

      if (path === "/api/auth" && method === "DELETE") {
        if (statusCode >= 200 && statusCode < 300) {
          this.decrementActiveUsers();
        }
      } else if (path === "/api/auth" && method === "PUT") {
        if (statusCode >= 200 && statusCode < 300) {
          this.incrementActiveUsers();
        }
      }

    });

    next();
  }
  incrementGetRequests() {
    this.getRequests += 1;
  }
  incrementPostRequests() {
    this.postRequests += 1;
  }
  incrementPutRequests() {
    this.putRequests += 1;
  }
  incrementDeleteRequests() {
    this.deleteRequests += 1;
  }
  incrementPizzaSuccess() {
    this.pizzaSuccess += 1;
  }
  incrementPizzaFailure() {
    this.pizzaFailure += 1;
  }
  incrementPizzaMoney(money) {
    this.pizzaMoney += money;
  }
  incrementAuthSuccess() {
    this.authSuccess += 1;
  }
  incrementAuthFailure() {
    this.authFailure += 1;
  }
  incrementActiveUsers() {
    this.activeUsers += 1;
  }
  decrementActiveUsers() {
    this.activeUsers -= 1;
    if (this.activeUsers < 0) {
      this.activeUsers = 0;
    }
  }

  sendOSmetrics() {
    this.sendMetricToGrafana("os", "GET", "cpu_usage_percentage", this.getCpuUsagePercentage());
    this.sendMetricToGrafana("os", "GET", "memory_usage_percentage", this.getMemoryUsagePercentage());
  }

  

getCpuUsagePercentage() {
  const cpuUsage = os.loadavg()[0] / os.cpus().length;
  return cpuUsage.toFixed(2) * 100;
}

getMemoryUsagePercentage() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = (usedMemory / totalMemory) * 100;
  return memoryUsage.toFixed(2);
}

  sendActiveUsersMetrics() {
    this.sendMetricToGrafana("active_users", "GET", "active_users_total", this.activeUsers);
  }

  sendPizzaMetrics() {
    this.sendMetricToGrafana("pizza", "POST", "success_total", this.pizzaSuccess);
    this.sendMetricToGrafana("pizza", "POST", "failure_total", this.pizzaFailure);
    this.sendMetricToGrafana("pizza", "POST", "money_total", this.pizzaMoney);
  }

  sendRequestMetrics() {
    this.sendMetricToGrafana("request", "GET", "requests_total", this.getRequests);
    this.sendMetricToGrafana("request", "POST", "requests_total", this.postRequests);
    this.sendMetricToGrafana("request", "PUT", "requests_total", this.putRequests);
    this.sendMetricToGrafana("request", "DELETE", "requests_total", this.deleteRequests);
    this.sendMetricToGrafana("request", "TOTAL", "success_total", this.getRequests + this.postRequests + this.putRequests + this.deleteRequests);
  }

  sendAuthMetrics() {
    this.sendMetricToGrafana("auth", "PUT", "auth_success_total", this.authSuccess);
    this.sendMetricToGrafana("auth", "PUT", "auth_failure_total", this.authFailure);
  }

  sendMetricToGrafana(metricPrefix, httpMethod, metricName, metricValue) {
    const metric = {
      resourceMetrics: [
        {
          scopeMetrics: [
            {
              metrics: [
                {
                  name: `${metricPrefix}_${httpMethod}_${metricName}`,
                  unit: "1",
                  description: "",
                  gauge: {
                    dataPoints: [
                      {
                        asDouble: metricValue,
                        timeUnixNano: Date.now() * 1000000,
                        attributes: [
                          {
                            key: "method",
                            value: {
                              stringValue: httpMethod,
                            },
                          },
                          {
                            key: "source",
                            value: {
                              stringValue: config.metrics.source,
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
    };

    fetch(`${config.metrics.url}`, {
      method: "POST",
      body: JSON.stringify(metric),
      headers: {
        Authorization: `Bearer ${config.metrics.apiKey}`,
        "Content-Type": "application/json",
      },
    })
      }
}

const metrics = new Metrics();
module.exports = metrics;
