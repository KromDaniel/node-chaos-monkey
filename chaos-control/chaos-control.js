const express = require("express");
const bodyParser = require("body-parser");

class ChaosControl {
  constructor(expressApplication, configuration) {
    console.log(`Chaos monkey is set to active`);
    this.configuration = configuration;
    this.app = expressApplication;
  }

  start() {
    console.log(`Opening the zoo now`);
    if (this.configuration.startMode === "config") {
      this.startAllConfigurationPranks([this.app]);
    }
    if (this.app) {
      this.registerAPI();
    }
  }

  registerAPI() {
    this.app.use(
      bodyParser.urlencoded({
        extended: true
      })
    );
    this.app.use(bodyParser.json());

    const router = express.Router();
    router.post("/chaos/pranks", (req, res) => {
      try {
        console.log(
          `Chaos gate was asked to start a new prank ${JSON.stringify(
            req.body
          )}`
        );
        this.startPrank(req.body, [this.app]);
        res.status(200).json({ status: "OK" });
      } catch (e) {
        console.log(e);
        res.status(500).json(e);
      }
    });
    this.app.use(router);
  }

  getPrankSchedule(prankConfig) {
    const ScheduleClass = require(`../schedules/${prankConfig.schedule.type}`);

    return new ScheduleClass(prankConfig.schedule);
  }

  startPrank(prankConfig, prankParams) {
    if (prankConfig.active === false) {
      console.info(`Prank ${prankConfig.name} is not active so not starting`);
      return;
    }

    console.info(
      `Chaos control is about to start the Prank ${prankConfig.name}`
    );

    const PrankClass = require(`../pranks/${prankConfig.file}`);
    console.log(PrankClass);
    const PrankSchedule = this.getPrankSchedule(prankConfig);
    const prankToStart = new PrankClass(
      prankConfig,
      PrankSchedule,
      ...prankParams
    );
    PrankSchedule.start();
  }

  startAllConfigurationPranks(prankParams) {
    this.configuration.pranks
      .filter(prank => prank.active === true)
      .forEach(prankConfiguration => {
        this.startPrank(prankConfiguration, prankParams);
      });
  }
}

module.exports = ChaosControl;
