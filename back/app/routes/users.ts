import express, { Request, Response, NextFunction } from 'express';
import { createUser, removeUser, getUser } from '../services/users';
import { IUser } from '../types/user';

var router = express.Router();

router.post('/create', function (req: Request, res: Response, next: NextFunction) {
    try {
        createUser(req.body)
    } catch (e) {
        res.status(400).json({
            "status": "400"
        });
    }
    res.status(200).json({
        "status": "200"
    });
});

router.get('/:id', (req: Request, res: Response) => {

    getUser(parseInt(req.params.id)).then((user: IUser) => {
        res.status(200).json(user);
    })
})

router.delete('/delete/:id', (req: Request, res: Response) => {
    removeUser(parseInt(req.params.id))
    res.status(200).json({
        "status": "200"
    });
})

export default router;