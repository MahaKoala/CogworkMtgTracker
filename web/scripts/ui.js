define(['ko', 'sprintf', './api', './log', './models/Modal'], function (ko, sprintf, api, log, Modal) {

    var ui = new function () {
        var self = this;

        /* context */
        this.activeGame = null;

        /* modals */
        // // use for trouble shooting, when necesary
        // this.firstModal = new Modal(function () {
        //     alert('OK');
        //     this.active(false);
        // });

        this.startGameModal = new Modal(
            function ok() {
                this.active(false);
                var game = api.startGame(
                        self.startGameModal.gameName(),
                        self.startGameModal.startingLifeTotal()
                );
                log.writeAction(
                    sprintf.sprintf("start game %s", game.startingLifeTotal()),
                    sprintf.sprintf("Game '%s' started with starting life totals of %s [gid=%s]", game.name(), game.startingLifeTotal(), game.id())
                );
                self.activeGame = game;
            });
        this.startGameModal.startingLifeTotal = ko.observable();
        this.startGameModal.gameName = ko.observable();
        this.startGameModal.show = function () {
            var _ = self.startGameModal
            _.startingLifeTotal(api.getDefaultStartingLifeTotal());
            _.gameName(api.getGameNameSuggestion());
            _.active(true);
        }

        this.joinPlayerModal = new Modal(
            function ok () {
                this.active(false);
                var _ = self.joinPlayerModal;
                var player = api.joinPlayer(_.playerName(), _.gameSelected().id(), _.teamSelected().id());
                if (_.teamSelected().id() != null) {
                    log.writeAction(
                        sprintf.sprintf("join %s to %s", player.name(), _.gameSelected().name()),
                        sprintf.sprintf("Player '%s' joined game '%s' at %s life [gid=%s, pid=%s]", 
                            player.name(), _.gameSelected().name(), player.lifeTotal(), _.gameSelected().id(), player.id())
                    );
                } else {
                    log.writeAction(
                        sprintf.sprintf("join %s to %s of %s", player.name(), _.teamSelected().name(), _.gameSelected().name()),
                        sprintf.sprintf("Player '%s' joined team '%s' of game '%s' [gid=%s, tid=%s, pid=%s]", 
                            player.name(), _.teamSelected().name(), _.gameSelected().name(), _.gameSelected().id(), _.teamSelected().id(), player.id())
                    );
                }
                self.activePlayer = player;
                self.activeGame = _.gameSelected();
            });
        this.joinPlayerModal.playerName = ko.observable();
        this.joinPlayerModal.games = ko.observableArray();
        this.joinPlayerModal.gameSelected = ko.observable();
        this.joinPlayerModal.teamSelected = ko.observable();
        this.joinPlayerModal.teams = ko.pureComputed(function () {
            var selection = self.joinPlayerModal.gameSelected() 
            var result = [{name: ko.observable('Single player or a new team'), id: function () { return null; }}];
            if (selection) {
                api.findGameById(selection.id()).teams().forEach(function (item) {
                    result.push(item);
                });
            }
            return result;
        });
        this.joinPlayerModal.show = function () {
            var _ = self.joinPlayerModal;
            _.playerName("");
            _.games(api.getGames());
            _.gameSelected(self.activeGame);
            _.teamSelected(_.teams()[0]);
            _.active(true);
        }

        this.resetAllModal = new Modal(
            function ok() {
                this.active(false);
                api.resetAll();
                log.writeAction("reset all","all games were reset and removed, bye!");
                self.activeGame = null;
            });

        this.dealCombatDamageModal = new Modal(
            function ok() {
                this.active(false);
                var _ = self.dealCombatDamageModal;
                api.dealCombatDamage(_.gameSelected().id(), _.playerSelected().id(), _.damage());
            }
        );
        this.dealCombatDamageModal.gameSelected = ko.observable();
        this.dealCombatDamageModal.games = ko.observableArray();
        this.dealCombatDamageModal.playerSelected = ko.observable();
        this.dealCombatDamageModal.players = ko.pureComputed(function () {
            var selection = self.dealCombatDamageModal.gameSelected() 
            if (selection) {
                return api.findGameById(selection.id()).players();
            } else {
                return [];
            }
        });
        this.dealCombatDamageModal.damage = ko.observable(0);
        this.dealCombatDamageModal.lifeAfterDamage = ko.pureComputed(function () {
            if (self.dealCombatDamageModal.playerSelected()) {
                return self.dealCombatDamageModal.playerSelected().lifeTotal() - self.dealCombatDamageModal.damage();
            } else {
                return null;
            }
        });
        this.dealCombatDamageModal.show = function () {
            var _ = self.dealCombatDamageModal;
            _.games(api.getGames());
            _.gameSelected(self.activeGame);
            _.playerSelected(null);
            _.damage(0);
            _.active(true);
        }

        this.gainLifeModal = new Modal(
            function ok() {
                this.active(false);
                var _ = self.gainLifeModal;
                api.gainLife(_.gameSelected().id(), _.playerSelected().id(), _.lifeGain());
            }
        );
        this.gainLifeModal.gameSelected = ko.observable();
        this.gainLifeModal.games = ko.observableArray();
        this.gainLifeModal.playerSelected = ko.observable();
        this.gainLifeModal.players = ko.pureComputed(function () {
            var selection = self.gainLifeModal.gameSelected() 
            if (selection) {
                return api.findGameById(selection.id()).players();
            } else {
                return [];
            }
        });
        this.gainLifeModal.lifeGain = ko.observable(0);
        this.gainLifeModal.lifeAfterDamage = ko.pureComputed(function () {
            if (self.gainLifeModal.playerSelected()) {
                return self.gainLifeModal.playerSelected().lifeTotal() + parseInt(self.gainLifeModal.lifeGain());
            } else {
                return null;
            }
        });
        this.gainLifeModal.show = function () {
            var _ = self.gainLifeModal;
            _.games(api.getGames());
            _.gameSelected(self.activeGame);
            _.playerSelected(null);
            _.lifeGain(0);
            _.active(true);
        }

        /* generic logic */
        this.modals = ko.observableArray([
            //this.firstModal, 
            this.startGameModal,
            this.joinPlayerModal,
            this.resetAllModal,
            this.dealCombatDamageModal,
            this.gainLifeModal
        ]);

        this.modalActive = ko.computed(function () {
            return this.modals().some(function (_) { return _.active() })
        }, this);

        this.closeModal = function () {
            self.modals().forEach(function (_) { _.active(false); });
            return true; //ensure other actions.
        }.bind(this);

    }();
    return ui;

});